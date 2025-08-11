import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PresenceState {
  totalOnline: number;
  routeOnline: number;
  peers: Array<{ key: string; user_id?: string; role?: string; route?: string; online_at?: string }>; 
}

export function usePresence(channelName: string = "presence:global") {
  const { user } = useAuth();
  const [state, setState] = useState<PresenceState>({ totalOnline: 0, routeOnline: 0, peers: [] });
  const chanRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    const key = user.id; // stable key
    const route = window.location.pathname;

    const channel = supabase.channel(channelName, {
      config: { presence: { key } },
    });

    chanRef.current = channel;

    const refresh = () => {
      const presence = channel.presenceState() as Record<string, any[]>;
      const peers: PresenceState["peers"] = [];
      Object.entries(presence).forEach(([k, list]) => {
        for (const entry of list as any[]) peers.push({ key: k, ...entry });
      });
      const totalOnline = peers.length;
      const routeOnline = peers.filter((p) => p.route === window.location.pathname).length;
      setState({ totalOnline, routeOnline, peers });
    };

    channel
      .on("presence", { event: "sync" }, refresh)
      .on("presence", { event: "join" }, refresh)
      .on("presence", { event: "leave" }, refresh)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await channel.track({ user_id: user.id, role: user.role, route, online_at: new Date().toISOString() });
      });

    const onRoute = () => {
      // update tracked route when path changes
      channel.track({ user_id: user.id, role: user.role, route: window.location.pathname, online_at: new Date().toISOString() });
      refresh();
    };
    window.addEventListener("popstate", onRoute);

    return () => {
      window.removeEventListener("popstate", onRoute);
      channel.unsubscribe();
    };
  }, [channelName, user?.id, user?.role]);

  return useMemo(() => state, [state]);
}

export default usePresence;
