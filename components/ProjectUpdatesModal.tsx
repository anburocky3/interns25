import React, { useState } from "react";

export interface ProjectWeekEntry {
  week: number;
  title: string;
  description: string;
  sourceCode: string;
  demo: string;
  acknowledgments: string;
  notes: string;
  status?: "pending" | "accepted" | "rejected";
}

interface ProjectUpdatesModalProps {
  open: boolean;
  onClose: () => void;
  weeks: ProjectWeekEntry[];
  onChange: (week: number, entry: Partial<ProjectWeekEntry>) => void;
  onSubmit: () => void;
  isAdmin?: boolean;
  onAdminAction?: (week: number, status: "accepted" | "rejected") => void;
}

const ProjectUpdatesModal: React.FC<ProjectUpdatesModalProps> = ({
  open,
  onClose,
  weeks,
  onChange,
  onSubmit,
  isAdmin = false,
  onAdminAction,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">25-Week Project Updates</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>
        <div className="space-y-6">
          {weeks.map((entry, idx) => (
            <div key={entry.week} className="border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Week {entry.week}</h3>
                {entry.status && (
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      entry.status === "accepted"
                        ? "bg-green-100 text-green-700"
                        : entry.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {entry.status.charAt(0).toUpperCase() +
                      entry.status.slice(1)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Project Title
                  </label>
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={entry.title}
                    onChange={(e) =>
                      onChange(entry.week, { title: e.target.value })
                    }
                    disabled={isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Source Code Link
                  </label>
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={entry.sourceCode}
                    onChange={(e) =>
                      onChange(entry.week, { sourceCode: e.target.value })
                    }
                    disabled={isAdmin}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    className="w-full border rounded px-2 py-1"
                    value={entry.description}
                    onChange={(e) =>
                      onChange(entry.week, { description: e.target.value })
                    }
                    disabled={isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Demo Link</label>
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={entry.demo}
                    onChange={(e) =>
                      onChange(entry.week, { demo: e.target.value })
                    }
                    disabled={isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Acknowledgments
                  </label>
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={entry.acknowledgments}
                    onChange={(e) =>
                      onChange(entry.week, { acknowledgments: e.target.value })
                    }
                    disabled={isAdmin}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Notes</label>
                  <textarea
                    className="w-full border rounded px-2 py-1"
                    value={entry.notes}
                    onChange={(e) =>
                      onChange(entry.week, { notes: e.target.value })
                    }
                    disabled={isAdmin}
                  />
                </div>
              </div>
              {isAdmin && (
                <div className="mt-2 flex gap-2">
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded"
                    onClick={() =>
                      onAdminAction && onAdminAction(entry.week, "accepted")
                    }
                  >
                    Accept
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded"
                    onClick={() =>
                      onAdminAction && onAdminAction(entry.week, "rejected")
                    }
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {!isAdmin && (
          <button
            className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            onClick={onSubmit}
          >
            Save All Weeks
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectUpdatesModal;
