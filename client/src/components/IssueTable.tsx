import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, ArrowUpDown } from "lucide-react";
import StatusBadge from "./StatusBadge";
import TypeBadge from "./TypeBadge";
import IssueForm from "./IssueForm";
import type { Issue } from "@shared/schema";

interface IssueTableProps {
  issues: Issue[];
  isLoading: boolean;
  onUpdate: (id: string, issue: Partial<Issue>) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export default function IssueTable({
  issues,
  isLoading,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: IssueTableProps) {
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
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

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('title')}>
                <div className="flex items-center">
                  Title
                  <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('type')}>
                <div className="flex items-center">
                  Type
                  <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('status')}>
                <div className="flex items-center">
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />
                </div>
              </TableHead>
              <TableHead>Expected Fix</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIssues.map((issue) => (
              <TableRow key={issue.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{issue.title}</TableCell>
                <TableCell>
                  <TypeBadge type={issue.type} />
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate" title={issue.description}>
                    {issue.description}
                  </div>
                </TableCell>
                <TableCell>{issue.impact}</TableCell>
                <TableCell>
                  <StatusBadge status={issue.status} />
                </TableCell>
                <TableCell>
                  {issue.expectedFixDate ? formatDate(issue.expectedFixDate) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingIssue(issue)}
                      disabled={isUpdating}
                    >
                      <Edit className="h-4 w-4 text-primary-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(issue.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingIssue && (
        <Dialog open={!!editingIssue} onOpenChange={() => setEditingIssue(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Issue</DialogTitle>
            </DialogHeader>
            <IssueForm
              initialData={editingIssue}
              onSubmit={(data) => {
                onUpdate(editingIssue.id, data);
                setEditingIssue(null);
              }}
              isLoading={isUpdating}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
