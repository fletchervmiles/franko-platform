import { NavSidebar } from "@/components/nav-sidebar";
import { SettingsProvider } from "@/lib/settings-context";
import ModalManager from "@/components/multi-agent/modal-manager";
import { ModalWorkspaceList } from "@/components/workspace-list";

export default function WorkspacePage() {
  return (
    <NavSidebar>
      <SettingsProvider>
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Workspace</h1>
            <p className="text-gray-600 mt-2">Manage your feedback modals and conversations</p>
          </div>
          
          <div className="grid gap-8">
            <div className="space-y-6">
              <ModalWorkspaceList />
            </div>
            
            <div className="space-y-6">
              <ModalManager />
            </div>
          </div>
        </div>
      </SettingsProvider>
    </NavSidebar>
  );
}