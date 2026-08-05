"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { publicTenant } from "../lib/public-tenant";
import {
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  Dog,
  FolderOpen,
  HeartPulse,
  Headphones,
  LayoutDashboard,
  ListTree,
  MessagesSquare,
  MonitorSmartphone,
  PackageSearch,
  Palette,
  PawPrint,
  Route,
  UserRound,
  UsersRound,
  WalletCards,
  MessageSquareText,
  Globe2,
  type LucideIcon,
} from "lucide-react";

type GroupKey = "Kennel day" | "Breeding" | "Puppy families" | "Business" | "Operations";
type NavItem = { label: string; view: string; icon: LucideIcon };
type NavGroup = { label: GroupKey; description: string; icon: LucideIcon; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Kennel day",
    description: "Daily priorities and calendar",
    icon: LayoutDashboard,
    items: [
      { label: "Daily overview", view: "Command", icon: LayoutDashboard },
      { label: "Kennel calendar", view: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Breeding",
    description: "Dogs, litters, puppies, and health",
    icon: Dog,
    items: [
      { label: "Breeding dogs", view: "Breeding", icon: Dog },
      { label: "Litters", view: "Litters", icon: ListTree },
      { label: "Puppies", view: "Puppies", icon: PawPrint },
      { label: "Health records", view: "Care", icon: HeartPulse },
    ],
  },
  {
    label: "Puppy families",
    description: "Application to puppy go-home",
    icon: UsersRound,
    items: [
      ...(publicTenant.features.applications ? [{ label: "Puppy applications", view: "Applications", icon: ClipboardCheck }] : []),
      { label: "Families & waitlist", view: "Families", icon: UsersRound },
      { label: "Puppy matching", view: "Placement", icon: UserRound },
      ...(publicTenant.features.transportation ? [{ label: "Go-home planning", view: "Delivery", icon: Route }] : []),
    ],
  },
  {
    label: "Business",
    description: "Sales, expenses, and insights",
    icon: WalletCards,
    items: [
      { label: "Sales & payments", view: "Finance", icon: WalletCards },
      { label: "Kennel expenses", view: "Inventory", icon: PackageSearch },
      { label: "Reports", view: "Reports", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "Operations",
    description: "Messages, portals, and documents",
    icon: FolderOpen,
    items: [
      { label: "Family messages", view: "Comms", icon: MessagesSquare },
      { label: "Templates & automation", view: "Templates", icon: MessageSquareText },
      ...(publicTenant.features.familyPortal ? [{ label: "Family portal", view: "Portal", icon: MonitorSmartphone }] : []),
      ...(publicTenant.features.phoneCenter ? [{ label: "Phone center", view: "CRM", icon: Headphones }] : []),
      { label: "Documents", view: "Vault", icon: FolderOpen },
    ],
  },
];

const itemForView = (view: string) => groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))).find((item) => item.view === view) ?? null;

export function NavigationGroupEnhancer() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupKey>("Kennel day");
  const [currentView, setCurrentView] = useState("Command");
  const bypassGroupInterception = useRef(false);
  const initializedFromUrl = useRef(false);

  const findMainGroupButton = useCallback((group: GroupKey) => {
    return Array.from(document.querySelectorAll<HTMLButtonElement>(".bos-workspaces > button"))
      .find((button) => button.querySelector("b")?.textContent?.trim() === group) ?? null;
  }, []);

  const findOriginalSubtab = useCallback((label: string) => {
    return Array.from(document.querySelectorAll<HTMLButtonElement>(".bos-context-bar > nav > button"))
      .find((button) => button.querySelector("b")?.textContent?.trim() === label) ?? null;
  }, []);

  const updateAddress = useCallback((view: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState({ view }, "", url);
  }, []);

  const openInternalView = useCallback((item: NavItem, group: GroupKey, updateUrl = true) => {
    setSelectedGroup(group);
    setCurrentView(item.view);
    if (updateUrl) updateAddress(item.view);

    const existingSubtab = findOriginalSubtab(item.label);
    if (existingSubtab) {
      existingSubtab.click();
      return;
    }

    const groupButton = findMainGroupButton(group);
    if (!groupButton) return;

    bypassGroupInterception.current = true;
    groupButton.click();

    let attempts = 0;
    const openWhenAvailable = () => {
      const target = findOriginalSubtab(item.label);
      if (target) {
        target.click();
        return;
      }
      attempts += 1;
      if (attempts < 20) window.setTimeout(openWhenAvailable, 25);
    };
    window.setTimeout(openWhenAvailable, 0);
  }, [findMainGroupButton, findOriginalSubtab, updateAddress]);

  useEffect(() => {
    const attach = () => {
      const workspaceNav = document.querySelector<HTMLElement>(".bos-workspaces");
      const contextBar = document.querySelector<HTMLElement>(".bos-context-bar");
      if (!workspaceNav || !contextBar) {
        setHost(null);
        return;
      }

      let target = contextBar.querySelector<HTMLElement>(":scope > .navigation-group-host");
      if (!target) {
        target = document.createElement("div");
        target.className = "navigation-group-host";
        contextBar.append(target);
      }
      contextBar.classList.add("navigation-group-enhanced");
      setHost(target);

      const buttons = Array.from(workspaceNav.querySelectorAll<HTMLButtonElement>(":scope > button"));
      buttons.forEach((button) => {
        const label = button.querySelector("b")?.textContent?.trim() as GroupKey | undefined;
        button.classList.toggle("nav-group-selected", label === selectedGroup);
      });
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [selectedGroup]);

  useEffect(() => {
    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>(".bos-workspaces > button");
      if (!button) return;

      if (bypassGroupInterception.current) {
        bypassGroupInterception.current = false;
        return;
      }

      const label = button.querySelector("b")?.textContent?.trim() as GroupKey | undefined;
      if (!label || !groups.some((group) => group.label === label)) return;
      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();
      setSelectedGroup(label);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  useEffect(() => {
    if (!host || initializedFromUrl.current) return;
    initializedFromUrl.current = true;
    const requestedView = new URLSearchParams(window.location.search).get("view") || "Command";
    const requestedItem = itemForView(requestedView);
    if (!requestedItem) return;
    window.setTimeout(() => {
      setSelectedGroup(requestedItem.group);
      setCurrentView(requestedItem.view);
      if (requestedItem.view !== "Command") openInternalView(requestedItem, requestedItem.group, false);
    }, 0);
  }, [host, openInternalView]);

  const selected = useMemo(() => groups.find((group) => group.label === selectedGroup) ?? groups[0], [selectedGroup]);

  if (!host) return null;
  const GroupIcon = selected.icon;

  return createPortal(<div className="navigation-group-panel">
    <header>
      <span><GroupIcon size={18} /></span>
      <div><b>{selected.label}</b><small>{selected.description}</small></div>
    </header>
    <nav aria-label={`${selected.label} pages`}>
      {selected.items.map((item) => {
        const Icon = item.icon;
        return <button key={item.view} type="button" className={currentView === item.view ? "active" : ""} onClick={() => openInternalView(item, selected.label)}>
          <Icon size={15} />
          <b>{item.label}</b>
        </button>;
      })}
    </nav>
    <footer>
      <div className="navigation-group-settings"><a href="/settings/branding"><Palette size={15}/><span>Brand studio</span></a><a href="/settings/domain"><Globe2 size={15}/><span>Domain</span></a></div>
      <div className="navigation-group-status"><i /><span><b>Kennel connected</b><small>Your records are synced and ready.</small></span></div>
    </footer>
  </div>, host);
}
