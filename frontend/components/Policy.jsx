import React from "react";

const Policy = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-3xl w-full">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-6">Privacy Policy</h1>

        <p className="mb-4 text-gray-700 text-lg">
          Playlist Migrator uses Google OAuth to allow users to access and migrate their YouTube Music playlists. When you sign in with your Google account, we request the following permission:
        </p>

        <ul className="list-disc list-inside mb-4 text-gray-700 text-lg space-y-2">
          <li>
            <strong>YouTube Data API (readonly):</strong> This allows us to view your playlists and track data so we can copy them into your destination music service.
          </li>
        </ul>

        <p className="mb-4 text-gray-700 text-lg">
          We <strong>do not store</strong> your Google account credentials, YouTube content, or personal data. The access token is stored only in your browser and used temporarily to complete the playlist migration.
        </p>

        <p className="mb-4 text-gray-700 text-lg">
          By using Playlist Migrator, you agree to allow us to access only the necessary information to perform the playlist transfer. No data is shared with third parties.
        </p>

        <p className="mb-4 text-gray-700 text-lg">
          If you have questions or concerns, please contact the developer at:{" "}
          <a
            href="mailto:tester.debug003@gmail.com"
            className="text-blue-600 underline hover:text-blue-800"
          >
            tester.debug003@gmail.com
          </a>
        </p>

        <p className="text-sm text-gray-500">Last updated: May 2025</p>
      </div>
    </div>
  );
};

export default Policy;
