import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required.",
        },
        { status: 400 }
      );
    }

    // Temporary admin credentials
    // In production, move these to environment variables.
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "admin123";

    if (
      username.trim() === ADMIN_USERNAME &&
      password === ADMIN_PASSWORD
    ) {
      return NextResponse.json({
        success: true,
        message: "Admin login successful.",
        admin: {
          username: ADMIN_USERNAME,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid username or password.",
      },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request.",
      },
      { status: 400 }
    );
  }
}