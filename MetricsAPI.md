API Documentation for Frontend Developers

This document provides comprehensive information on the new API endpoints designed to provide valuable metrics for both creators and users on Base.tube. It includes details on how to use these endpoints, the data they return, and how to implement the corresponding metrics on the frontend.

Table of Contents

	1.	For Creators
	•	Like Growth Over Time
	•	Most Liked Videos Ranking
	•	Like-to-View Ratio
	2.	For Users
	•	Like History with Filtering Options
	•	Channels They Like Most Frequently
	•	Like Milestones
	3.	General Notes
	4.	Implementation Suggestions

For Creators

1. Like Growth Over Time

Endpoint

	•	URL: /api/creators/:userId/likes/trends
	•	Method: GET
	•	Authentication: Required (creator must be authenticated)

Description

Retrieves the like growth over time for the creator’s videos, providing daily, weekly, and monthly trends.

Path Parameters

	•	userId (string): The ID of the creator (must match the authenticated user’s ID)

Response

{
  "success": true,
  "data": {
    "dailyLikes": [
      {
        "date": "2023-10-12",
        "likeCount": 25
      },
      {
        "date": "2023-10-13",
        "likeCount": 30
      },
      // ...
    ],
    "weeklyLikes": [
      {
        "date": "2023-10-07",
        "likeCount": 150
      },
      // ...
    ],
    "monthlyLikes": [
      {
        "date": "2023-09-14",
        "likeCount": 600
      },
      // ...
    ]
  }
}

Data Explanation

	•	dailyLikes: Array of like counts per day over the last 1 day.
	•	weeklyLikes: Array of like counts per day over the last 7 days.
	•	monthlyLikes: Array of like counts per day over the last 30 days.
	•	Each item includes:
	•	date (string): The date in YYYY-MM-DD format.
	•	likeCount (number): The total number of likes received on that date.

Usage

	•	Display Trend Charts: Use the data to plot line or bar charts showing like growth over time.
	•	Identify Trends: Help creators identify days with high engagement.
	•	Compare Periods: Allow creators to switch between daily, weekly, and monthly views.

2. Most Liked Videos Ranking

Endpoint

	•	URL: /api/creators/:userId/likes/top-videos
	•	Method: GET
	•	Authentication: Required

Query Parameters

	•	limit (optional, number): Number of top videos to retrieve (default is 10)

Response

{
  "success": true,
  "data": [
    {
      "id": 101,
      "title": "How to Cook the Perfect Steak",
      "thumbnail": "/thumbnails/101.jpg",
      "likesCount": 1500
    },
    {
      "id": 102,
      "title": "10 Minute Yoga for Beginners",
      "thumbnail": "/thumbnails/102.jpg",
      "likesCount": 1200
    },
    // ...
  ]
}

Data Explanation

	•	An array of the creator’s most liked videos, sorted by likesCount in descending order.
	•	Each item includes:
	•	id (number): Video ID.
	•	title (string): Video title.
	•	thumbnail (string): URL/path to the video thumbnail.
	•	likesCount (number): Total number of likes the video has received.

Usage

	•	Display Top Videos List: Show a ranked list of the creator’s most liked videos.
	•	Link to Video Analytics: Allow creators to click on a video to see more detailed analytics.
	•	Encourage Content Strategy: Help creators understand which content resonates most with their audience.

3. Like-to-View Ratio

Endpoint

	•	URL: /api/creators/:userId/videos/:videoId/like-view-ratio
	•	Method: GET
	•	Authentication: Required

Path Parameters

	•	userId (string): Creator’s user ID.
	•	videoId (number): ID of the video to analyze.

Response

{
  "success": true,
  "data": {
    "videoId": 101,
    "likesCount": 1500,
    "viewsCount": 30000,
    "likeToViewRatio": "5.00"
  }
}

Data Explanation

	•	videoId (number): Video ID.
	•	likesCount (number): Total number of likes the video has received.
	•	viewsCount (number): Total number of views the video has.
	•	likeToViewRatio (string): Percentage of viewers who liked the video, formatted to two decimal places.

Usage

	•	Display Engagement Metrics: Show the like-to-view ratio alongside other video stats.
	•	Benchmark Performance: Help creators assess how well their videos engage viewers relative to views.
	•	Identify High-Performing Content: Highlight videos with high engagement rates.

For Users

1. Like History with Filtering Options

Endpoint

	•	URL: /api/users/:userId/likes/history
	•	Method: GET
	•	Authentication: Required

Query Parameters

	•	page (optional, number): Page number for pagination (default is 1).
	•	limit (optional, number): Number of items per page (default is 10).
	•	channelId (optional, number): Filter likes by channel ID.
	•	dateFrom (optional, string): Start date in YYYY-MM-DD format.
	•	dateTo (optional, string): End date in YYYY-MM-DD format.

Response

{
  "success": true,
  "data": {
    "total": 50,
    "currentPage": 1,
    "totalPages": 5,
    "likes": [
      {
        "videoId": 201,
        "videoTitle": "Travel Vlog: Exploring Japan",
        "channelId": 10,
        "channelName": "Wanderlust",
        "likedAt": "2023-10-13T14:22:00Z"
      },
      {
        "videoId": 202,
        "videoTitle": "Top 10 Coding Tips",
        "channelId": 11,
        "channelName": "CodeMaster",
        "likedAt": "2023-10-12T10:15:00Z"
      },
      // ...
    ]
  }
}

Data Explanation

	•	total (number): Total number of likes matching the filters.
	•	currentPage (number): Current page number.
	•	totalPages (number): Total number of pages.
	•	likes: Array of liked videos.
	•	videoId (number): ID of the liked video.
	•	videoTitle (string): Title of the video.
	•	channelId (number): ID of the channel that uploaded the video.
	•	channelName (string): Name of the channel.
	•	likedAt (string): ISO date-time when the video was liked.

Usage

	•	Display Like History: Show a list of videos the user has liked.
	•	Filtering Options: Allow users to filter their like history by date range or channel.
	•	Revisit Liked Content: Enable users to quickly find and watch videos they’ve liked in the past.

2. Channels They Like Most Frequently

Endpoint

	•	URL: /api/users/:userId/likes/top-channels
	•	Method: GET
	•	Authentication: Required

Query Parameters

	•	limit (optional, number): Number of top channels to retrieve (default is 5)

Response

{
  "success": true,
  "data": [
    {
      "channelId": 10,
      "channelName": "Wanderlust",
      "likeCount": 20
    },
    {
      "channelId": 11,
      "channelName": "CodeMaster",
      "likeCount": 15
    },
    // ...
  ]
}

Data Explanation

	•	An array of channels the user has liked most frequently, sorted by likeCount in descending order.
	•	Each item includes:
	•	channelId (number): ID of the channel.
	•	channelName (string): Name of the channel.
	•	likeCount (number): Number of times the user has liked videos from this channel.

Usage

	•	Display Favorite Channels: Show users which channels they engage with the most.
	•	Encourage Subscriptions: Prompt users to subscribe to channels they frequently like but haven’t subscribed to yet.
	•	Personal Insights: Help users understand their viewing preferences.

3. Like Milestones

Endpoint

	•	URL: /api/users/:userId/likes/milestones
	•	Method: GET
	•	Authentication: Required

Response

{
  "success": true,
  "data": {
    "totalLikes": 150,
    "nextMilestone": 200,
    "previousMilestone": 100,
    "progress": "50.00"
  }
}

Data Explanation

	•	totalLikes (number): Total number of likes the user has given.
	•	nextMilestone (number or null): The next milestone the user is approaching. null if all milestones are achieved.
	•	previousMilestone (number): The most recent milestone the user has passed.
	•	progress (string): Percentage progress towards the next milestone, formatted to two decimal places.

Usage

	•	Display Milestone Progress: Show a progress bar or similar visual to represent progress towards the next milestone.
	•	Celebrate Achievements: Notify users when they reach a milestone.
	•	Encourage Engagement: Motivate users to continue liking content to reach the next milestone.

General Notes

	•	Authentication: All endpoints require the user to be authenticated. The userId in the path parameters must match the authenticated user’s ID.
	•	Date Formats: Dates are provided in ISO 8601 format (e.g., YYYY-MM-DDTHH:mm:ssZ).
	•	Pagination: For endpoints that return lists, pagination is implemented using page and limit query parameters.
	•	Error Handling: In case of errors, the API will return a JSON response with success: false and a message describing the error.

Example Error Response:

{
  "success": false,
  "message": "Unauthorized"
}

Implementation Suggestions

Frontend Integration

1. Fetching Data

Use standard HTTP requests to fetch data from the API endpoints. Ensure that the authentication token (e.g., JWT) is included in the request headers.

Example:

// Example using fetch API
fetch(`/api/users/${userId}/likes/history?page=1&limit=10`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  }
})
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Use the data
    } else {
      // Handle error
    }
  })
  .catch(error => {
    console.error('Error fetching like history:', error);
  });

2. Displaying Metrics

	•	Charts and Graphs: Use chart libraries like Chart.js or D3.js to visualize trends and progress.
	•	Lists and Tables: Present data like like history and top channels in user-friendly lists or tables with sorting and filtering options.
	•	Progress Bars: Display milestones using progress bars or similar components to visually represent progress.

3. User Experience Enhancements

	•	Loading States: Implement loading indicators while data is being fetched.
	•	Error Handling: Show user-friendly error messages in case of API failures.
	•	Responsive Design: Ensure that metrics and data visualizations are responsive and look good on various devices.

Metric Implementations

Creators

	•	Like Growth Charts: Use line charts to show daily, weekly, and monthly like trends.
	•	Top Videos Section: Display the most liked videos with thumbnails, titles, and like counts. Allow creators to click through to detailed analytics.
	•	Engagement Ratios: Present the like-to-view ratio as a percentage, possibly with visual indicators like gauges.

Users

	•	Like History Page: Provide a dedicated page where users can browse their like history, with options to filter and sort the data.
	•	Favorite Channels: Show a list of the user’s most liked channels, encouraging them to subscribe or explore more content.
	•	Milestone Notifications: Implement in-app notifications or badges when users reach new like milestones.

Additional Considerations

	•	Localization: Ensure that dates and numbers are formatted according to the user’s locale.
	•	Accessibility: Design components that are accessible to all users, including those using screen readers.
	•	Caching and Performance: Implement caching strategies where appropriate to improve performance.

Example Usage Scenarios

Creator’s Dashboard

	•	Display like trends over different time frames to help creators analyze their content performance.
	•	Highlight top-performing videos so creators can identify what content resonates with their audience.
	•	Show engagement ratios to provide insights into viewer interaction beyond just views.

User’s Profile

	•	Provide a personalized like history, allowing users to revisit and manage their liked videos.
	•	Display favorite channels, potentially suggesting subscriptions or new content from those channels.
	•	Celebrate milestones by displaying achievements and progress towards the next milestone.

Testing the Endpoints

Ensure to test the API endpoints thoroughly during development.
	•	Use Tools: Utilize tools like Postman or Insomnia to test API calls and inspect responses.
	•	Handle Edge Cases: Test with different parameter values, including limits, dates, and filters.
	•	Verify Authentication: Confirm that unauthorized access is properly handled and that authenticated users can only access their own data.

