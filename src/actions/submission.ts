
import { Octokit } from "@octokit/core";
import { v4 as uuidv4 } from 'uuid';
import {
  createPullRequest,
  DELETE_FILE,
} from "octokit-plugin-create-pull-request";
import getCurrentUser from "./getCurrentUser";
import { db } from "@/lib/db";
const MyOctokit = Octokit.plugin(createPullRequest);

export const createSubmission = async (
  assignmentDetails: any,
  files: any,
  mentorDetails: any
) => {
  const user = await getCurrentUser();
  if (!user) {
    return { message: "unauthorized" };
  }

  const submissions = await db.submission.findMany({
    where: {
      attachmentId: assignmentDetails.id,
      enrolledUser:{
        username:user.username
      },
    },
  });

  if (submissions.length >= assignmentDetails.maxSubmissions ) {
    return { message: "Maximum submission limit reached" };
  }

  const octokit = new MyOctokit({
    auth: process.env.GITHUB_PAT,
  });
  const submissionId = uuidv4();

  const pr = await octokit.createPullRequest({
    owner: "GoodKodersUnV",
    repo: "LMS-DATA",
    title: `${assignmentDetails.title} submission by ${user.username}`,
    body: `
      # Assignment submission by ${user.username}

      ## User Details:
      - Name: ${user.name}
      - Email: ${user.email}
      - Username: ${user.username}

      ## Assignment Id: ${assignmentDetails.id}
      ## Submission Id: ${submissionId}
      ## Submitted by: ${user.username}

      ## Submission Details:
      - Assignment Title: ${assignmentDetails.title}
      - Course: ${assignmentDetails.class.course.title}
      - Class: ${assignmentDetails.class.title}
      - Due Date: ${assignmentDetails.dueDate}
      - Submission Date: ${new Date().toISOString()}
      - Submission Files:
        ${Object.keys(files).map((file) => {
          return `\n - ${file}`;
        })}
      `,
    head: `${user.username?.trim()}-submissionId-${submissionId}`,
    base: `main`,
    update: true,
    forceFork: false,
    labels: [
      user.username,
      "assignment-submission",
      assignmentDetails.class.course.title,
      assignmentDetails.title,
      `mentor-${mentorDetails.mentor.username}`,
    ],
    changes: [
      {
        files,
        commit: `submitted assignment ${assignmentDetails.id} by ${user.username}`,
        author: {
          name: "goodkodersUnV",
          email: "goodkodersUnV@gmail.com",
          date: new Date().toISOString(),
        },
      },
    ],
  });

  if(!pr){
    return { message: "Error submitting assignment" };
  }

  const prUrl = pr.data.html_url;

  const enrolledUser = await db.enrolledUsers.findUnique({
    where:{
      username_courseId_mentorUsername:{
        username:user.username,
        courseId:assignmentDetails.class.courseId,
        mentorUsername:mentorDetails.mentor.username
      }
    }
  });
  if(!enrolledUser) return null;

  const submission = await db.submission.create({
    data: {
      id: submissionId,
      attachmentId: assignmentDetails.id,
      submissionLink: prUrl,
      enrolledUserId: enrolledUser.id,
    },
  });

  return submission;
};


export const addOverallFeedback = async (submissionId: string, feedback: string) => {
  const user = await getCurrentUser();
  if (!user) {
    return { message: "unauthorized" };
  }

  const submission = await db.submission.findUnique({
    where: {
      id: submissionId,
    },
  });

  if (!submission) {
    return { message: "Submission not found" };
  }

  const updatedSubmission = await db.submission.update({
    where: {
      id: submissionId,
    },
    data: { 
      overallFeedback: feedback,
    },
  });


  return updatedSubmission;
}