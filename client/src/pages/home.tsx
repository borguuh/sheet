import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bug, Shield, Plus, LogOut } from "lucide-react";
import IssueTable from "@/components/IssueTable";
import IssueForm from "@/components/IssueForm";
import IssueFilters from "@/components/IssueFilters";
import type { Issue, InsertIssue } from "@shared/schema";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to login to access the admin panel.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: issues = [], isLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues", filters],
    retry: false,
  });

  const createIssueMutation = useMutation({
    mutationFn: async (issue: InsertIssue) => {
      const response = await apiRequest("POST", "/api/issues", issue);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Issue created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create issue",
        variant: "destructive",
      });
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, issue }: { id: string; issue: Partial<Issue> }) => {
      const response = await apiRequest("PUT", `/api/issues/${id}`, issue);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      toast({
        title: "Success",
        description: "Issue updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update issue",
        variant: "destructive",
      });
    },
  });

  const deleteIssueMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/issues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      toast({
        title: "Success",
        description: "Issue deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete issue",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

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
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-primary-100 text-primary-800">
                <Shield className="mr-1 h-3 w-3" />
                Admin Mode
              </Badge>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/api/logout'}
                className="inline-flex items-center"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
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
                Issue Dashboard
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Track and manage project issues and feature requests
              </p>
            </div>
            
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary-600 hover:bg-primary-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Issue
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Issue</DialogTitle>
                  </DialogHeader>
                  <IssueForm
                    onSubmit={(data) => createIssueMutation.mutate(data)}
                    isLoading={createIssueMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

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
            <IssueTable
              issues={issues}
              isLoading={isLoading}
              onUpdate={(id, issue) => updateIssueMutation.mutate({ id, issue })}
              onDelete={(id) => deleteIssueMutation.mutate(id)}
              isUpdating={updateIssueMutation.isPending}
              isDeleting={deleteIssueMutation.isPending}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
