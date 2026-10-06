"use client";

// Grid of project cards linking to each workspace.

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
      <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-12 text-center text-slate-500">
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
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
        >
          <h3 className="font-semibold text-slate-900">{project.name}</h3>
          {project.description && (
            <p className="mt-1 text-sm text-slate-600 line-clamp-2">
              {project.description}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
}
