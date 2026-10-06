"use client";

import Link from "next/link";

type Project = {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string | null; email: string };
  collaborators: Array<{
    id: string;
    role: string;
    user: { id: string; name: string | null; email: string };
  }>;
  updatedAt: Date | string;
};

export default function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="mt-8 rounded-lg border-2 border-dashed p-12 text-center text-gray-500">
        No projects yet. Create your first one.
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="rounded-lg border p-4 transition hover:border-blue-500 hover:shadow-md"
        >
          <h3 className="font-semibold">{project.name}</h3>
          {project.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {project.description}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
}
