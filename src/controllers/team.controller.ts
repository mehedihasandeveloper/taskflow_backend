import { Project } from "../models/Project";
import { asyncHandler } from "../utils/asyncHandler";
import { projectAccess } from "../utils/access";
import { publicUser, UserLike } from "../utils/serialize";

type TeammateProject = { id: string; name: string; isOwner: boolean; canRemove: boolean };
type Teammate = ReturnType<typeof publicUser> & { projects: TeammateProject[] };

// GET /team - everyone who shares a project with the current user
export const getTeam = asyncHandler(async (_req, res) => {
  const me = String(res.locals.userId);
  const projects = await Project.find(projectAccess(me))
    .sort({ name: 1 })
    .populate([
      { path: "owner", select: "name email avatar" },
      { path: "members", select: "name email avatar" },
    ]);

  const people = new Map<string, Teammate>();
  const ownedProjects: { id: string; name: string }[] = [];

  for (const project of projects) {
    const owner = project.owner as unknown as UserLike;
    const members = project.members as unknown as UserLike[];
    const iOwn = owner.id === me;
    if (iOwn) ownedProjects.push({ id: project.id, name: project.name });

    const add = (user: UserLike, isOwner: boolean) => {
      if (user.id === me) return;
      const entry = people.get(user.id) ?? { ...publicUser(user), projects: [] };
      entry.projects.push({ id: project.id, name: project.name, isOwner, canRemove: iOwn && !isOwner });
      people.set(user.id, entry);
    };
    add(owner, true);
    members.forEach((m) => add(m, false));
  }

  const teammates = [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
  res.json({ teammates, ownedProjects });
});