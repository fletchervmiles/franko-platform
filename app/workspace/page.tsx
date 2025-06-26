import { NavSidebar } from "@/components/nav-sidebar";
import { SettingsProvider } from "@/lib/settings-context";
import ModalManager from "@/components/multi-agent/modal-manager";

export default function WorkspacePage() {
  return (
    <NavSidebar>
      <SettingsProvider>
        <div className="w-full p-4 md:p-8 lg:p-12">
          <ModalManager />
        </div>
      </SettingsProvider>
    </NavSidebar>
  );
}