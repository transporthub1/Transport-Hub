  /*
   * ----------------------------------------------------
   * WITHDRAW STATUS
   * ----------------------------------------------------
   *
   * WEEKLY WITHDRAWAL:
   * - Deducts from users.withdrawable_returns
   *
   * REFERRAL WITHDRAWAL:
   * - Deducts from users.balance
   * - Also keeps withdrawable_returns synchronized
   *
   * REJECTION:
   * - Does not deduct any balance
   * ----------------------------------------------------
   */
  const updateWithdrawStatus = async (
    requestId,
    newStatus
  ) => {
    const request =
      withdrawRequests.find(
        (item) =>
          item.id ===
          requestId
      );

    if (!request) {
      setMessage(
        "Withdrawal request not found."
      );

      setMessageType(
        "error"
      );

      return;
    }

    const currentStatus =
      String(
        request.status ||
          "Pending"
      ).toLowerCase();

    if (
      currentStatus !==
      "pending"
    ) {
      setMessage(
        "This withdrawal has already been processed."
      );

      setMessageType(
        "error"
      );

      return;
    }

    const phone =
      normalizePhone(
        request.phone ||
          request.mobile ||
          request.mobileNumber ||
          request.user?.phone ||
          ""
      );

    if (!phone) {
      setMessage(
        "User mobile number is missing from this withdrawal request."
      );

      setMessageType(
        "error"
      );

      return;
    }

    const withdrawAmount =
      Number(
        request.amount || 0
      );

    if (
      !Number.isFinite(
        withdrawAmount
      ) ||
      withdrawAmount <= 0
    ) {
      setMessage(
        "Invalid withdrawal amount."
      );

      setMessageType(
        "error"
      );

      return;
    }

    /*
     * --------------------------------------------------
     * DETECT WITHDRAWAL TYPE
     * --------------------------------------------------
     *
     * Referral types:
     * Referral
     * Referral Bonus
     * Bonus
     * Wallet
     * Wallet Balance
     *
     * Everything else remains Weekly.
     */
    const rawReturnType =
      String(
        request.returnType ||
          request.return_type ||
          request.user?.returnType ||
          "Weekly"
      )
        .trim()
        .toLowerCase();

    const isReferralWithdrawal =
      rawReturnType ===
        "referral" ||
      rawReturnType ===
        "referral bonus" ||
      rawReturnType ===
        "referralbonus" ||
      rawReturnType ===
        "bonus" ||
      rawReturnType ===
        "wallet" ||
      rawReturnType ===
        "wallet balance" ||
      rawReturnType ===
        "walletbalance";

    const withdrawalType =
      isReferralWithdrawal
        ? "Referral"
        : "Weekly";

    /*
     * --------------------------------------------------
     * APPROVAL
     * --------------------------------------------------
     */
    if (
      newStatus ===
      "Approved"
    ) {
      try {
        /*
         * STEP 1:
         * Read the latest central user balance.
         *
         * We read BOTH balance and withdrawable_returns
         * because referral and weekly withdrawals use
         * different wallets.
         */
        const {
          data: currentUser,
          error: userReadError,
        } = await supabase
          .from("users")
          .select(
            "id, full_name, phone, balance, withdrawable_returns, referral_bonus, total_referral_bonus"
          )
          .eq(
            "phone",
            phone
          )
          .maybeSingle();

        if (userReadError) {
          console.error(
            "Could not read withdrawal balance:",
            userReadError
          );

          setMessage(
            "Supabase Error: " +
              userReadError.message
          );

          setMessageType(
            "error"
          );

          return;
        }

        if (!currentUser) {
          setMessage(
            "User was not found in Supabase."
          );

          setMessageType(
            "error"
          );

          return;
        }

        const currentBalance =
          Number(
            currentUser.balance ||
              0
          );

        const currentReturns =
          Number(
            currentUser.withdrawable_returns ||
              0
          );

        /*
         * ------------------------------------------------
         * REFERRAL WITHDRAWAL
         * ------------------------------------------------
         *
         * Referral withdrawal is deducted from the
         * user's Wallet Balance.
         */
        if (
          isReferralWithdrawal
        ) {
          if (
            withdrawAmount >
            currentBalance
          ) {
            setMessage(
              "Insufficient wallet balance. Available in Supabase: PKR " +
                currentBalance.toLocaleString()
            );

            setMessageType(
              "error"
            );

            return;
          }

          const newBalance =
            currentBalance -
            withdrawAmount;

          /*
           * Keep referral bonus balance synchronized.
           *
           * referral_bonus represents the currently
           * credited referral bonus balance.
           */
          const currentReferralBonus =
            Number(
              currentUser.referral_bonus ||
                0
            );

          const newReferralBonus =
            Math.max(
              0,
              currentReferralBonus -
                withdrawAmount
            );

          /*
           * IMPORTANT:
           *
           * The existing system also credits referral
           * bonuses into withdrawable_returns.
           *
           * We therefore deduct the same referral amount
           * from withdrawable_returns as well, but never
           * allow it to go below zero.
           *
           * This prevents the same referral bonus from
           * remaining available for another withdrawal.
           */
          const newWithdrawableReturns =
            Math.max(
              0,
              currentReturns -
                withdrawAmount
            );

          /*
           * STEP 2:
           * Deduct referral withdrawal from Wallet Balance
           * and synchronize the referral wallet fields.
           */
          const {
            data: updatedUser,
            error: userUpdateError,
          } = await supabase
            .from("users")
            .update({
              balance:
                newBalance,

              referral_bonus:
                newReferralBonus,

              withdrawable_returns:
                newWithdrawableReturns,
            })
            .eq(
              "id",
              currentUser.id
            )
            .select(
              "id, full_name, phone, balance, withdrawable_returns, referral_bonus, total_referral_bonus"
            )
            .maybeSingle();

          if (userUpdateError) {
            console.error(
              "Could not deduct referral withdrawal from Supabase:",
              userUpdateError
            );

            setMessage(
              "Supabase Error while deducting referral withdrawal: " +
                userUpdateError.message
            );

            setMessageType(
              "error"
            );

            return;
          }

          const finalBalance =
            Number(
              updatedUser?.balance ??
                newBalance
            );

          const finalReferralBonus =
            Number(
              updatedUser?.referral_bonus ??
                newReferralBonus
            );

          const finalReturns =
            Number(
              updatedUser?.withdrawable_returns ??
                newWithdrawableReturns
            );

          /*
           * STEP 3:
           * Update withdrawal request status.
           */
          const {
            error: requestUpdateError,
          } = await supabase
            .from("withdraw_requests")
            .update({
              status:
                "Approved",

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              requestId
            );

          if (requestUpdateError) {
            /*
             * Compensation:
             * Restore all values if request status
             * could not be updated.
             */
            console.error(
              "Referral withdrawal status update failed. Restoring balances:",
              requestUpdateError
            );

            const {
              error: restoreError,
            } = await supabase
              .from("users")
              .update({
                balance:
                  currentBalance,

                referral_bonus:
                  currentReferralBonus,

                withdrawable_returns:
                  currentReturns,
              })
              .eq(
                "id",
                currentUser.id
              );

            if (restoreError) {
              console.error(
                "CRITICAL: Could not restore referral withdrawal balances:",
                restoreError
              );
            }

            setMessage(
              "Referral withdrawal approval failed: " +
                requestUpdateError.message
            );

            setMessageType(
              "error"
            );

            await loadUsers();
            await loadWithdrawRequests();

            return;
          }

          /*
           * STEP 4:
           * Mirror all updated balances locally.
           */
          localStorage.setItem(
            "transportWithdrawableReturns_" +
              phone,
            String(
              finalReturns
            )
          );

          try {
            const savedUsers =
              localStorage.getItem(
                "transportUsers"
              );

            if (savedUsers) {
              const parsed =
                JSON.parse(
                  savedUsers
                );

              if (
                Array.isArray(parsed)
              ) {
                const updatedLocalUsers =
                  parsed.map(
                    (user) => {
                      const userPhone =
                        normalizePhone(
                          user.phone ||
                            user.mobile ||
                            user.mobileNumber ||
                            user.phoneNumber
                        );

                      if (
                        userPhone ===
                        phone
                      ) {
                        return {
                          ...user,

                          balance:
                            finalBalance,

                          withdrawableReturns:
                            finalReturns,

                          withdrawable_returns:
                            finalReturns,

                          referralBonus:
                            finalReferralBonus,

                          referral_bonus:
                            finalReferralBonus,
                        };
                      }

                      return user;
                    }
                  );

                localStorage.setItem(
                  "transportUsers",
                  JSON.stringify(
                    updatedLocalUsers
                  )
                );
              }
            }
          } catch (error) {
            console.error(
              "Could not update local users after referral withdrawal approval:",
              error
            );
          }

          /*
           * STEP 5:
           * Update existing pending withdrawal transaction.
           */
          const withdrawalTransactionId =
            "withdraw-" +
            request.id;

          const updatedExistingTransaction =
            updateSavedTransactionStatus(
              withdrawalTransactionId,
              phone,
              "Approved"
            );

          const withdrawalTransaction = {
            id:
              withdrawalTransactionId,

            type:
              "Withdrawal",

            amount:
              withdrawAmount,

            status:
              "Approved",

            phone:
              phone,

            transactionId:
              request.transactionId ||
              request.txId ||
              request.transectionId ||
              request.transactionID ||
              "",

            number:
              request.number ||
              request.withdrawNumber ||
              request.mobileNumber ||
              request.withdrawPhone ||
              "",

            screenshot:
              request.screenshot ||
              request.paymentScreenshot ||
              request.receipt ||
              "",

            date:
              request.submittedAt
                ? new Date(
                    request.submittedAt
                  ).toLocaleString()
                : new Date().toLocaleString(),

            createdAt:
              request.submittedAt ||
              new Date().toISOString(),

            returnType:
              request.returnType ||
              "Referral",

            description:
              "Referral Withdrawal Approved",
          };

          if (
            !updatedExistingTransaction
          ) {
            saveTransaction(
              withdrawalTransaction,
              phone
            );
          }

          const withdrawalTransactionSavedToSupabase =
            await saveTransactionToSupabase(
              withdrawalTransaction,
              phone
            );

          /*
           * STEP 6:
           * Update request locally.
           */
          const updatedRequest = {
            ...request,

            status:
              "Approved",

            updatedAt:
              new Date().toISOString(),

            returnType:
              request.returnType ||
              "Referral",

            availableBalanceAtRequest:
              finalBalance,

            withdrawableBalance:
              finalReturns,
          };

          const updatedRequests =
            withdrawRequests.map(
              (item) =>
                item.id ===
                requestId
                  ? updatedRequest
                  : item
            );

          saveWithdrawRequests(
            updatedRequests
          );

          /*
           * STEP 7:
           * Refresh central data.
           */
          await loadUsers();
          await loadWithdrawRequests();

          setMessage(
            "Referral withdrawal of PKR " +
              withdrawAmount.toLocaleString() +
              " for " +
              (
                request.fullName ||
                "user"
              ) +
              " approved successfully. PKR " +
              withdrawAmount.toLocaleString() +
              " has been deducted from Wallet Balance. Remaining Wallet Balance: PKR " +
              finalBalance.toLocaleString() +
              "." +
              (
                withdrawalTransactionSavedToSupabase
                  ? " Withdrawal transaction synced to Supabase."
                  : " Warning: withdrawal transaction could not be synced to Supabase."
              )
          );

          setMessageType(
            withdrawalTransactionSavedToSupabase
              ? "success"
              : "error"
          );

          return;
        }

        /*
         * ------------------------------------------------
         * WEEKLY WITHDRAWAL
         * ------------------------------------------------
         *
         * WEEKLY BEHAVIOR REMAINS THE SAME:
         * Deduct ONLY from withdrawable_returns.
         */
        if (
          withdrawAmount >
          currentReturns
        ) {
          setMessage(
            "Insufficient earned returns. Available in Supabase: PKR " +
              currentReturns.toLocaleString()
          );

          setMessageType(
            "error"
          );

          return;
        }

        const newReturns =
          currentReturns -
          withdrawAmount;

        /*
         * STEP 2:
         * Deduct weekly withdrawal centrally.
         */
        const {
          data: updatedUser,
          error: userUpdateError,
        } = await supabase
          .from("users")
          .update({
            withdrawable_returns:
              newReturns,
          })
          .eq(
            "id",
            currentUser.id
          )
          .select(
            "id, phone, balance, withdrawable_returns"
          )
          .maybeSingle();

        if (userUpdateError) {
          console.error(
            "Could not deduct weekly withdrawal from Supabase:",
            userUpdateError
          );

          setMessage(
            "Supabase Error while deducting withdrawal: " +
              userUpdateError.message
          );

          setMessageType(
            "error"
          );

          return;
        }

        const finalReturns =
          Number(
            updatedUser?.withdrawable_returns ??
              newReturns
          );

        /*
         * STEP 3:
         * Update withdrawal request status.
         */
        const {
          error: requestUpdateError,
        } = await supabase
          .from("withdraw_requests")
          .update({
            status:
              "Approved",

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            requestId
          );

        if (requestUpdateError) {
          /*
           * Compensation:
           * Restore weekly return balance if request
           * status could not be updated.
           */
          console.error(
            "Withdrawal request status update failed. Restoring balance:",
            requestUpdateError
          );

          const {
            error: restoreError,
          } = await supabase
            .from("users")
            .update({
              withdrawable_returns:
                currentReturns,
            })
            .eq(
              "id",
              currentUser.id
            );

          if (restoreError) {
            console.error(
              "CRITICAL: Could not restore withdrawal balance:",
              restoreError
            );
          }

          setMessage(
            "Withdrawal approval failed: " +
              requestUpdateError.message
          );

          setMessageType(
            "error"
          );

          await loadUsers();
          await loadWithdrawRequests();

          return;
        }

        /*
         * STEP 4:
         * Mirror weekly balance locally.
         */
        localStorage.setItem(
          "transportWithdrawableReturns_" +
            phone,
          String(
            finalReturns
          )
        );

        try {
          const savedUsers =
            localStorage.getItem(
              "transportUsers"
            );

          if (savedUsers) {
            const parsed =
              JSON.parse(
                savedUsers
              );

            if (
              Array.isArray(parsed)
            ) {
              const updatedLocalUsers =
                parsed.map(
                  (user) => {
                    const userPhone =
                      normalizePhone(
                        user.phone ||
                          user.mobile ||
                          user.mobileNumber ||
                          user.phoneNumber
                      );

                    if (
                      userPhone ===
                      phone
                    ) {
                      return {
                        ...user,

                        withdrawableReturns:
                          finalReturns,

                        withdrawable_returns:
                          finalReturns,
                      };
                    }

                    return user;
                  }
                );

              localStorage.setItem(
                "transportUsers",
                JSON.stringify(
                  updatedLocalUsers
                )
              );
            }
          }
        } catch (error) {
          console.error(
            "Could not update local users after withdrawal approval:",
            error
          );
        }

        /*
         * STEP 5:
         * Update existing pending withdrawal transaction.
         */
        const withdrawalTransactionId =
          "withdraw-" +
          request.id;

        const updatedExistingTransaction =
          updateSavedTransactionStatus(
            withdrawalTransactionId,
            phone,
            "Approved"
          );

        const withdrawalTransaction = {
          id:
            withdrawalTransactionId,

          type:
            "Withdrawal",

          amount:
            withdrawAmount,

          status:
            "Approved",

          phone:
            phone,

          transactionId:
            request.transactionId ||
            request.txId ||
            request.transectionId ||
            request.transactionID ||
            "",

          number:
            request.number ||
            request.withdrawNumber ||
            request.mobileNumber ||
            request.withdrawPhone ||
            "",

          screenshot:
            request.screenshot ||
            request.paymentScreenshot ||
            request.receipt ||
            "",

          date:
            request.submittedAt
              ? new Date(
                  request.submittedAt
                ).toLocaleString()
              : new Date().toLocaleString(),

          createdAt:
            request.submittedAt ||
            new Date().toISOString(),

          returnType:
            request.returnType ||
            "Weekly",

          description:
            "Withdrawal Approved",
        };

        if (
          !updatedExistingTransaction
        ) {
          saveTransaction(
            withdrawalTransaction,
            phone
          );
        }

        const withdrawalTransactionSavedToSupabase =
          await saveTransactionToSupabase(
            withdrawalTransaction,
            phone
          );

        /*
         * STEP 6:
         * Update request locally.
         */
        const updatedRequest = {
          ...request,

          status:
            "Approved",

          updatedAt:
            new Date().toISOString(),

          returnType:
            request.returnType ||
            "Weekly",

          withdrawableBalance:
            finalReturns,
        };

        const updatedRequests =
          withdrawRequests.map(
            (item) =>
              item.id ===
              requestId
                ? updatedRequest
                : item
          );

        saveWithdrawRequests(
          updatedRequests
        );

        /*
         * STEP 7:
         * Refresh central data.
         */
        await loadUsers();
        await loadWithdrawRequests();

        setMessage(
          "Weekly withdrawal of PKR " +
            withdrawAmount.toLocaleString() +
            " for " +
            (
              request.fullName ||
              "user"
            ) +
            " approved successfully. PKR " +
            withdrawAmount.toLocaleString() +
            " has been deducted from withdrawable returns. Remaining withdrawable returns: PKR " +
            finalReturns.toLocaleString() +
            "." +
            (
              withdrawalTransactionSavedToSupabase
                ? " Withdrawal transaction synced to Supabase."
                : " Warning: withdrawal transaction could not be synced to Supabase."
            )
        );

        setMessageType(
          withdrawalTransactionSavedToSupabase
            ? "success"
            : "error"
        );

        return;
      } catch (error) {
        console.error(
          "Withdrawal approval error:",
          error
        );

        setMessage(
          "Something went wrong while approving the withdrawal."
        );

        setMessageType(
          "error"
        );

        return;
      }
    }

    /*
     * --------------------------------------------------
     * REJECTION
     * --------------------------------------------------
     *
     * No balance is deducted when a withdrawal is
     * rejected.
     */
    if (
      newStatus ===
      "Rejected"
    ) {
      try {
        const {
          error: requestUpdateError,
        } = await supabase
          .from("withdraw_requests")
          .update({
            status:
              "Rejected",

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            requestId
          );

        if (requestUpdateError) {
          console.error(
            "Supabase withdrawal rejection update error:",
            requestUpdateError
          );

          setMessage(
            "Supabase Error: " +
              requestUpdateError.message
          );

          setMessageType(
            "error"
          );

          return;
        }

        const withdrawalTransactionId =
          "withdraw-" +
          request.id;

        const updatedExistingTransaction =
          updateSavedTransactionStatus(
            withdrawalTransactionId,
            phone,
            "Rejected"
          );

        const withdrawalTransaction = {
          id:
            withdrawalTransactionId,

          type:
            "Withdrawal",

          amount:
            withdrawAmount,

          status:
            "Rejected",

          phone:
            phone,

          transactionId:
            request.transactionId ||
            request.txId ||
            request.transectionId ||
            request.transactionID ||
            "",

          number:
            request.number ||
            request.withdrawNumber ||
            request.mobileNumber ||
            request.withdrawPhone ||
            "",

          screenshot:
            request.screenshot ||
            request.paymentScreenshot ||
            request.receipt ||
            "",

          date:
            request.submittedAt
              ? new Date(
                  request.submittedAt
                ).toLocaleString()
              : new Date().toLocaleString(),

          createdAt:
            request.submittedAt ||
            new Date().toISOString(),

          returnType:
            request.returnType ||
            "Weekly",

          description:
            "Withdrawal Rejected",
        };

        if (
          !updatedExistingTransaction
        ) {
          saveTransaction(
            withdrawalTransaction,
            phone
          );
        }

        const withdrawalTransactionSavedToSupabase =
          await saveTransactionToSupabase(
            withdrawalTransaction,
            phone
          );

        const updatedRequest = {
          ...request,

          status:
            "Rejected",

          updatedAt:
            new Date().toISOString(),
        };

        const updatedRequests =
          withdrawRequests.map(
            (item) =>
              item.id ===
              requestId
                ? updatedRequest
                : item
          );

        saveWithdrawRequests(
          updatedRequests
        );

        await loadWithdrawRequests();
        await loadUsers();

        setMessage(
          "Withdrawal request of PKR " +
            withdrawAmount.toLocaleString() +
            " for " +
            (
              request.fullName ||
              "user"
            ) +
            " rejected. No amount was deducted from the user's balance." +
            (
              withdrawalTransactionSavedToSupabase
                ? " Withdrawal transaction synced to Supabase."
                : " Warning: withdrawal transaction could not be synced to Supabase."
            )
        );

        setMessageType(
          withdrawalTransactionSavedToSupabase
            ? "success"
            : "error"
        );

        return;
      } catch (error) {
        console.error(
          "Withdrawal rejection error:",
          error
        );

        setMessage(
          "Something went wrong while rejecting the withdrawal."
        );

        setMessageType(
          "error"
        );

        return;
      }
    }

    /*
     * --------------------------------------------------
     * INVALID STATUS
     * --------------------------------------------------
     */
    setMessage(
      "Invalid withdrawal status."
    );

    setMessageType(
      "error"
    );
  };