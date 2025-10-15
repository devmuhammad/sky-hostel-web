"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SoldOutPage() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              We Are Sold Out
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Unfortunately, all rooms in our hostel are currently occupied. We
              appreciate your interest and encourage you to check back later for
              any available spaces.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>What you can do:</strong>
                </p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• Check back regularly for new availability</li>
                  <li>• Contact our admin for waitlist options</li>
                  <li>• Follow us for updates on new rooms</li>
                </ul>
              </div>

              <Button
                onClick={handleGoHome}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{" "}
            <a
              href="mailto:support@skystudenthostel.com"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              support@skystudenthostel.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
