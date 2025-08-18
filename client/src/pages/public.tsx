import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug, Shield, ExternalLink } from "lucide-react";
import IssueTable from "@/components/IssueTable";
import IssueFilters from "@/components/IssueFilters";
import type { Issue } from "@shared/schema";

export default function PublicIssueViewer() {
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
  });

  const { data: issues = [], isLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues", filters],
    retry: false,
  });

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold leading-7 text-gray-900 sm:text-4xl sm:truncate">
                Public Issue Tracker
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                View all issues and feature requests. Admin login required to create or modify issues.
              </p>
            </div>
            
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button
                onClick={() => window.location.href = '/api/login'}
                variant="outline"
                className="inline-flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            </div>
          </div>
        </div>

        {/* Notice Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Bug className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Public View Mode
                </p>
                <p className="text-sm text-blue-600">
                  You can view all issues below. To create, edit, or delete issues, please login as an admin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <IssueFilters filters={filters} onFiltersChange={setFilters} />

        {/* Issues Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Issues & Feature Requests</CardTitle>
            <p className="text-sm text-gray-500">
              {issues.length} total issues
            </p>
          </CardHeader>
          <CardContent>
            <PublicIssueTable issues={issues} isLoading={isLoading} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Read-only version of the issue table for public viewing
function PublicIssueTable({ issues, isLoading }: { issues: Issue[], isLoading: boolean }) {
  const [sortField, setSortField] = useState<keyof Issue>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Issue) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    const aValue = a[sortField] ?? '';
    const bValue = b[sortField] ?? '';
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <Bug className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No issues match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('title')}
            >
              Title
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('type')}
            >
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Impact
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expected Fix
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedIssues.map((issue) => (
            <tr key={issue.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{issue.title}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  issue.type === 'issue' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {issue.type === 'issue' ? 'Issue' : 'Feature Request'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-xs truncate" title={issue.description}>
                  {issue.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  issue.impact === 'Critical' ? 'bg-red-100 text-red-800' :
                  issue.impact === 'High' ? 'bg-orange-100 text-orange-800' :
                  issue.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {issue.impact}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  issue.status === 'open' ? 'bg-red-100 text-red-800' :
                  issue.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {issue.expectedFixDate ? formatDate(issue.expectedFixDate) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(issue.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}