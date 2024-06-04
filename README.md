# React Video Chat

React Video Chat is an application that enables real-time video communication between peers using WebRTC technology. This project includes both the client-side and server-side code, and they can be run concurrently.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have Node.js and npm installed on your system. You can download them from [Node.js](https://nodejs.org/).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/waitaya/react-video-chat.git
2. Navigate to the project directory:
   ```bash
   cd react-video-chat
3. Install the dependencies:
   ```bash
   npm install
4. Running the Application (You can run both the server and client concurrently using the following command):
   ```bash
   npm run start 

### Usage

1. Open your browser and navigate to [http://localhost:3000](http://localhost:3000) .
2. You will see a video stream from your webcam.
3. Open another browser window or tab and navigate to [http://localhost:3000](http://localhost:3000) to simulate another peer joining the call.
4. You should see the video streams from both peers.
5. To initiate a call, click on the user you want to call from the list.
6. When receiving a call, an alert will appear asking you to accept the call. Click "Accept" to start the video call.