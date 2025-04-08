"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Loader2, PlusCircle, Edit, Trash2, Copy, AlertTriangle, RefreshCw } from 'lucide-react';
import { WebhookForm } from './webhook-form'; // We will create this next

// Define the shape of the webhook data we expect from the API (excluding secret)
export interface WebhookDisplayData {
    id: string;
    chatInstanceId: string;
    url: string;
    description: string | null;
    eventType: string;
    isActive: boolean;
    createdAt: string; // Assuming ISO string format
    updatedAt: string; // Assuming ISO string format
}

interface WebhookSettingsProps {
    chatInstanceId: string;
}

export function WebhookSettings({ chatInstanceId }: WebhookSettingsProps) {
    const [webhooks, setWebhooks] = useState<WebhookDisplayData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFormDialog, setShowFormDialog] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<WebhookDisplayData | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null); // Store webhook ID to delete
    const [showSecretDialog, setShowSecretDialog] = useState<{ id: string; secret: string } | null>(null);
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState<string | null>(null); // Store webhook ID to regenerate
    const [isToggling, setIsToggling] = useState<string | null>(null); // Store ID of webhook being toggled
    const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store ID of webhook being deleted
    const [isRegenerating, setIsRegenerating] = useState<string | null>(null); // Store ID of webhook being regenerated

    const fetchWebhooks = useCallback(async () => {
        // Prevent fetching if the ID isn't available yet or is empty
        if (!chatInstanceId || typeof chatInstanceId !== 'string' || chatInstanceId.trim() === '') {
            setError('Chat instance ID is not available yet.');
            setIsLoading(false); // Stop loading state
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const apiUrl = `/api/chat-instances/${chatInstanceId}/webhooks`;
            console.log('[WebhookSettings] Fetching webhooks from:', apiUrl); // Log the URL being fetched
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch webhooks (${response.status})`);
            }
            const data: WebhookDisplayData[] = await response.json();
            setWebhooks(data);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred');
            toast({
                title: "Error",
                description: `Failed to load webhooks: ${err.message}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [chatInstanceId]);

    useEffect(() => {
        console.log('[WebhookSettings] chatInstanceId prop changed:', chatInstanceId); // Log prop changes
        fetchWebhooks();
    }, [fetchWebhooks]);

    const handleAddWebhook = () => {
        setEditingWebhook(null); // Ensure we're not editing
        setShowFormDialog(true);
    };

    const handleEditWebhook = (webhook: WebhookDisplayData) => {
        setEditingWebhook(webhook);
        setShowFormDialog(true);
    };

    const handleFormSave = async (savedWebhookData: WebhookDisplayData & { secret?: string }) => {
        setShowFormDialog(false);
        setEditingWebhook(null);
        await fetchWebhooks(); // Refresh the list

        // If a secret was included in the save data (meaning it was just created/regenerated), show it
        if (savedWebhookData.secret) {
             setShowSecretDialog({ id: savedWebhookData.id, secret: savedWebhookData.secret });
        }
    };

    const handleFormCancel = () => {
        setShowFormDialog(false);
        setEditingWebhook(null);
    };

    const handleToggleActive = async (webhookId: string, currentIsActive: boolean) => {
        setIsToggling(webhookId);
        try {
            const response = await fetch(`/api/chat-instances/${chatInstanceId}/webhooks/${webhookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentIsActive }),
            });
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to toggle webhook status (${response.status})`);
            }
            // Optimistically update UI or refetch
            setWebhooks(prev => prev.map(wh => wh.id === webhookId ? { ...wh, isActive: !currentIsActive } : wh));
             toast({
                title: "Success",
                description: `Webhook ${!currentIsActive ? 'activated' : 'deactivated'}.`,
            });
        } catch (err: any) {
             toast({
                title: "Error",
                description: `Failed to toggle webhook: ${err.message}`,
                variant: "destructive",
            });
        } finally {
            setIsToggling(null);
        }
    };

     const handleDeleteConfirm = async () => {
        if (!showDeleteConfirm) return;
        setIsDeleting(showDeleteConfirm);

        try {
            const response = await fetch(`/api/chat-instances/${chatInstanceId}/webhooks/${showDeleteConfirm}`, {
                method: 'DELETE',
            });
             if (!response.ok && response.status !== 204) { // 204 No Content is success for DELETE
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to delete webhook (${response.status})`);
            }
             toast({
                title: "Success",
                description: "Webhook deleted successfully.",
            });
            // Remove from list
             setWebhooks(prev => prev.filter(wh => wh.id !== showDeleteConfirm));
        } catch (err: any) {
             toast({
                title: "Error",
                description: `Failed to delete webhook: ${err.message}`,
                variant: "destructive",
            });
        } finally {
             setShowDeleteConfirm(null);
             setIsDeleting(null);
        }
    };

     const handleRegenerateConfirm = async () => {
        if (!showRegenerateConfirm) return;
         setIsRegenerating(showRegenerateConfirm);

        try {
             const response = await fetch(`/api/chat-instances/${chatInstanceId}/webhooks/${showRegenerateConfirm}`, {
                method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ regenerateSecret: true }),
            });
             if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to regenerate secret (${response.status})`);
            }
            const updatedWebhookWithSecret = await response.json();
             toast({
                title: "Success",
                description: "Webhook secret regenerated.",
            });
             // Show the new secret
             setShowSecretDialog({ id: showRegenerateConfirm, secret: updatedWebhookWithSecret.secret });
             // No need to refetch list as other details haven't changed
        } catch (err: any) {
             toast({
                title: "Error",
                description: `Failed to regenerate secret: ${err.message}`,
                variant: "destructive",
            });
        } finally {
             setShowRegenerateConfirm(null);
             setIsRegenerating(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied!", description: "Secret copied to clipboard." });
        }, (err) => {
            toast({ title: "Error", description: "Failed to copy secret.", variant: "destructive"});
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="text-lg font-medium">Webhooks</CardTitle>
                    <CardDescription>
                        Trigger external actions when conversations are completed.
                    </CardDescription>
                </div>
                 <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={handleAddWebhook} disabled={isLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Webhook
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px] bg-white">
                         <WebhookForm
                            chatInstanceId={chatInstanceId}
                            webhookData={editingWebhook}
                            onSave={handleFormSave}
                            onCancel={handleFormCancel}
                        />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading webhooks...</span>
                    </div>
                )}
                {error && !isLoading && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error Loading Webhooks</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {!isLoading && !error && webhooks.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        No webhooks configured yet. Add one to get started.
                    </div>
                )}
                 {!isLoading && !error && webhooks.length > 0 && (
                    <div className="space-y-4">
                        {webhooks.map((webhook) => (
                            <div key={webhook.id} className="flex items-center justify-between space-x-4 p-4 border rounded-md bg-white shadow-sm">
                                <div className="flex-1 min-w-0">
                                     <p className="text-sm font-medium leading-none truncate" title={webhook.url}>
                                        {webhook.description || webhook.url}
                                     </p>
                                     <p className="text-xs text-muted-foreground truncate">
                                        {webhook.description ? webhook.url : `Created: ${new Date(webhook.createdAt).toLocaleDateString()}`}
                                     </p>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setShowRegenerateConfirm(webhook.id)}
                                        title="Regenerate Secret"
                                        disabled={isRegenerating === webhook.id}
                                     >
                                         {isRegenerating === webhook.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    </Button>
                                     <Switch
                                        id={`active-${webhook.id}`}
                                        checked={webhook.isActive}
                                        onCheckedChange={() => handleToggleActive(webhook.id, webhook.isActive)}
                                        disabled={isToggling === webhook.id}
                                        aria-label={webhook.isActive ? 'Deactivate webhook' : 'Activate webhook'}
                                        title={webhook.isActive ? 'Deactivate webhook' : 'Activate webhook'}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleEditWebhook(webhook)}
                                        title="Edit Webhook"
                                     >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive/90"
                                        onClick={() => setShowDeleteConfirm(webhook.id)}
                                        disabled={isDeleting === webhook.id}
                                        title="Delete Webhook"
                                    >
                                         {isDeleting === webhook.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

             {/* Delete Confirmation Dialog */}
             <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
                 <AlertDialogContent className="bg-white">
                     <AlertDialogHeader>
                         <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                         <AlertDialogDescription>
                             This action cannot be undone. This will permanently delete the webhook configuration.
                         </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                         <AlertDialogCancel>Cancel</AlertDialogCancel>
                         <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                             Delete
                         </AlertDialogAction>
                     </AlertDialogFooter>
                 </AlertDialogContent>
             </AlertDialog>

             {/* Regenerate Secret Confirmation Dialog */}
              <AlertDialog open={!!showRegenerateConfirm} onOpenChange={(open) => !open && setShowRegenerateConfirm(null)}>
                 <AlertDialogContent>
                     <AlertDialogHeader>
                         <AlertDialogTitle>Regenerate Secret?</AlertDialogTitle>
                         <AlertDialogDescription>
                              Are you sure you want to regenerate the signing secret? The current secret will stop working immediately. You will need to update any services using the old secret.
                         </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                         <AlertDialogCancel>Cancel</AlertDialogCancel>
                         <AlertDialogAction onClick={handleRegenerateConfirm}>
                             Regenerate
                         </AlertDialogAction>
                     </AlertDialogFooter>
                 </AlertDialogContent>
             </AlertDialog>


             {/* Display Secret Dialog */}
            <Dialog open={!!showSecretDialog} onOpenChange={(open) => !open && setShowSecretDialog(null)}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle>Webhook Secret</DialogTitle>
                        <DialogDescription>
                            Copy your secret key below. Store it securely, as **you will not see it again.**
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 mt-4">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link" className="sr-only">
                                Secret
                            </Label>
                            <Input
                                id="link"
                                defaultValue={showSecretDialog?.secret}
                                readOnly
                                className="font-mono text-xs"
                            />
                        </div>
                        <Button type="button" size="sm" className="px-3" onClick={() => showSecretDialog && copyToClipboard(showSecretDialog.secret)}>
                            <span className="sr-only">Copy</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter className="sm:justify-end mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </Card>
    );
}

// Default export is necessary for dynamic import if not using named exports { default: ... }
export default WebhookSettings; 