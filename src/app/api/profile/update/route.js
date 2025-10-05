import { NextResponse } from "next/server"
import { withAuth, withErrorHandling } from "@/lib/middleware"
import connectToMongoose from "@/lib/mongoose"
import User from "@/models/User"

async function updateProfileHandler(request) {
  await connectToMongoose()

  const user = request.user
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  try {
    const { firstName, lastName, bio, location } = await request.json()

    // Validate input
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        firstName,
        lastName,
        'profile.bio': bio || '',
        location: location || '',
      },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        profile: updatedUser.profile,
        location: updatedUser.location,
        createdAt: updatedUser.createdAt
      }
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

const authenticatedHandler = withAuth(updateProfileHandler)
const errorHandledHandler = withErrorHandling(authenticatedHandler)

export const PUT = errorHandledHandler