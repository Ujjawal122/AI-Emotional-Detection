import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import Mood from "@/models/Mood";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const userId = new mongoose.Types.ObjectId(user._id);

    // Get total count
    const total = await Mood.countDocuments({ user: userId });

    // Fetch mood entries with pagination
    const moods = await Mood.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Group moods by date
    const groupedByDate: Record<string, typeof moods> = {};
    moods.forEach((mood) => {
      const dateKey = new Date(mood.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(mood);
    });

    // Get mood stats for the specified period
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const stats = await Mood.aggregate([
      { $match: { user: userId, createdAt: { $gte: cutoff } } },
      {
        $group: {
          _id: "$sentiment",
          count: { $sum: 1 },
          avgIntensity: { $avg: "$intensity" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json({
      moods: moods.map((m) => ({
        ...m,
        _id: m._id.toString(),
        user: (m.user as mongoose.Types.ObjectId).toString(),
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      groupedByDate,
      stats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching mood history:", error);
    return NextResponse.json(
      { error: "Failed to fetch mood history" },
      { status: 500 }
    );
  }
}
