import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-surface shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-700 flex items-center">
                <Bug className="mr-2 h-6 w-6" />
                IssueTracker Pro
              </h1>
            </div>
            <Button
              onClick={() => window.location.href = '/api/login'}
              className="inline-flex items-center bg-primary-600 hover:bg-primary-700"
            >
              <Shield className="mr-2 h-4 w-4" />
              Admin Login
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Issue Management System
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Track and manage project issues and feature requests with ease
          </p>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Admin Access Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Please authenticate with admin credentials to access the issue tracker.
              </p>
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="w-full bg-primary-600 hover:bg-primary-700"
              >
                <Shield className="mr-2 h-4 w-4" />
                Login with Replit Auth
              </Button>
              <p className="text-xs text-gray-500">
                Admin access required for creating, editing, and deleting issues
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
