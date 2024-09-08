"use client";
import Image from "next/image";
import { FaCrown } from "react-icons/fa6";
import { useState, useEffect } from "react";
import NoDataFound from "./NoDataFound";

export default function Leaderboard({
  submissions,
  courses,
  currentUser,
  mentors,
}: {
  submissions: any[];
  courses: any[];
  currentUser: any;
  mentors?: any[];
}) {
  const [currentCourse, setCurrentCourse] = useState<string>(courses[0]?.id);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [mentorUsername, setMentorUsername] = useState<any>(
    mentors ? mentors[0]?.username : null
  );
  useEffect(() => {
    let filteredSubmissions;
    if (currentUser.role === "INSTRUCTOR") {
      filteredSubmissions = submissions.filter(
        (x: any) =>
          x.enrolledUser.mentor.username === mentorUsername &&
          x?.assignment?.class?.course?.id === currentCourse
      );
    } else {
      filteredSubmissions = submissions.filter(
        (x: any) => x?.assignment?.class?.course?.id === currentCourse
      );
    }

    const leaderboardMap = new Map();

    filteredSubmissions.forEach((submission: any) => {
      const userId = submission?.enrolledUser?.user?.id;
      const totalPoints = submission.totalPoints;
      if (leaderboardMap.has(userId)) {
        leaderboardMap.get(userId).totalPoints += totalPoints;
      } else {
        leaderboardMap.set(userId, {
          userId: userId,
          totalPoints: totalPoints,
          name: submission.enrolledUser.user.name,
          username: submission.enrolledUser.user.username,
          image: submission.enrolledUser.user.image,
          rank: submission.rank,
        });
      }
    });

    const leaderboardArray = Array.from(leaderboardMap.values());

    leaderboardArray.sort((a, b) => b.totalPoints - a.totalPoints);

    setLeaderboardData(leaderboardArray);
  }, [currentCourse, submissions, mentorUsername]);


  return (
    <div className="mx-2 md:mx-14 mt-1 flex flex-col gap-4">
      {/* Leaderboard-header */}
      <div className="flex flex-col text-center">
        <FaCrown className="h-20 w-20 m-auto text-yellow-400" />
        <h1 className="text-2xl font-semibold text-yellow-300">Leaderboard</h1>
      </div>
      {/* Mentors list for instructor */}
      {currentUser.role === "INSTRUCTOR" && (
        <div className="flex gap-3 mt-4">
          {mentors?.map((mentor: any) => (
            <button
              onClick={() => setMentorUsername(mentor.username)}
              key={mentor.id}
              className={`p-1 px-2 text-primary-500 rounded ${mentor.username === mentorUsername
                ? "shadow-sm shadow-primary-500"
                : ""
                }`}
            >
              {mentor.username}
            </button>
          ))}
        </div>
      )}
      {/* Courses list */}
      <div className="flex gap-3 mt-4">
        {courses?.map((course: any) => (
          <button
            hidden={course.isPublished === false}
            onClick={() => setCurrentCourse(course.id)}
            className={`rounded p-1 px-2 w-20 sm:w-auto ${currentCourse === course.id && "border rounded"
              }`}
            key={course.id}
          >
            <h1 className="truncate max-w-xs text-sm font-medium">
              {course.title}
            </h1>
          </button>
        ))}
      </div>
      {/* Leaderboard*/}
      {leaderboardData.length === 0 ? (
         <NoDataFound message="No data found!" />
      ) : (
        <table>
          <thead className="bg-slate-600">
            <tr>
              <th className="text-start pl-12 py-2 uppercase text-sm">
                <div className="flex items-center gap-2">
                  Rank
                </div>
              </th>
              <th className="text-start uppercase text-sm">
                <div className="flex items-center gap-2">
                  Name
                </div>
              </th>
              <th className="text-start uppercase text-sm">
                <div className="flex items-center gap-2">
                  Points
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((data: any, index: number) => {
              if (data.totalPoints === 0) return null;
              return (
                <tr
                  className={`p-2 px-4 border-b-2 bg-gradient-to-r hover:text-white  ${currentUser.username === data.username
                    ? "from-yellow-500/65 via-yellow-600/80 to-yellow-700"
                    : "hover:from-blue-600 hover:to-sky-500"
                    }`}
                  key={index}
                >
                  <td className="pl-12">{index + 1}</td>
                  <td className="flex md:gap-4 items-center">
                    <Image
                      src={data?.image || "/images/placeholder.jpg"}
                      alt={`User ${index + 1}`}
                      width={35}
                      height={35}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="py-2">
                      <h1 className="text-md font-medium">{data.name}</h1>
                      <h1 className="text-xs">@{data.username}</h1>
                    </div>
                  </td>
                  <td>
                    <h1 className="font-medium text-xs md:text-sm">
                      {data.totalPoints} points
                    </h1>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
