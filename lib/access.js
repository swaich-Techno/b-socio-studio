import Client from "@/models/Client";
import { isOwnerAdmin } from "@/lib/auth";

export function agencyClientFilter(user) {
  if (user?.agencyName) return { agencyName: user.agencyName };
  return { userId: user._id };
}

export function clientVisibilityFilter(user) {
  if (isOwnerAdmin(user)) {
    return agencyClientFilter(user);
  }

  const assignedClientIds = user.assignedClients || [];

  return {
    $or: [
      { _id: { $in: assignedClientIds } },
      { assignedTeamMembers: user._id },
      { assignedDesigner: user._id },
      { assignedReelEditor: user._id },
      { assignedPhotographer: user._id },
      { assignedAdsManager: user._id },
      { assignedCoordinator: user._id },
      { visibleToAllTeam: true, agencyName: user.agencyName }
    ]
  };
}

export async function accessibleClientIds(user) {
  const clients = await Client.find(clientVisibilityFilter(user)).select("_id").lean();
  return clients.map((client) => client._id);
}

export async function canAccessClient(user, clientId) {
  const client = await Client.findOne({ ...clientVisibilityFilter(user), _id: clientId }).select("_id").lean();
  return Boolean(client);
}
