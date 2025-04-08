"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';
import type { WebhookDisplayData } from './webhook-settings'; // Import the display type

interface WebhookFormProps {
    chatInstanceId: string;
    webhookData: WebhookDisplayData | null; // Pass existing data if editing
    onSave: (data: WebhookDisplayData & { secret?: string }) => void; // Callback on successful save, potentially includes secret
    onCancel: () => void;
}

export function WebhookForm({ chatInstanceId, webhookData, onSave, onCancel }: WebhookFormProps) {
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [addSecret, setAddSecret] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const isEditing = !!webhookData;

    useEffect(() => {
        if (isEditing && webhookData) {
            setUrl(webhookData.url);
            setDescription(webhookData.description || '');
            // In edit mode, we don't show the "add secret" checkbox,
            // secret management happens via "regenerate" button outside the form.
             setAddSecret(false); // Reset just in case
        } else {
            // Reset form for adding
            setUrl('');
            setDescription('');
            setAddSecret(false);
        }
    }, [isEditing, webhookData]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

        // Basic Validation
        if (!url) {
            toast({ title: "Validation Error", description: "Endpoint URL is required.", variant: "destructive" });
            setIsLoading(false);
            return;
        }
        try {
            new URL(url);
            // Optionally enforce HTTPS here if desired
        } catch (_) {
             toast({ title: "Validation Error", description: "Invalid Endpoint URL format.", variant: "destructive" });
            setIsLoading(false);
            return;
        }


        const payload: any = {
            url,
            description: description || null, // Send null if empty
        };

        let apiUrl = `/api/chat-instances/${chatInstanceId}/webhooks`;
        let method = 'POST';

        if (isEditing && webhookData) {
             apiUrl = `/api/chat-instances/${chatInstanceId}/webhooks/${webhookData.id}`;
             method = 'PUT';
        } else {
             // Only include addSecret flag when creating
             payload.addSecret = addSecret;
        }


        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                 throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} webhook (${response.status})`);
            }

             toast({
                title: "Success",
                description: `Webhook ${isEditing ? 'updated' : 'created'} successfully.`,
            });

            // Call the onSave callback, passing the result which might include the secret
            onSave(result);

        } catch (err: any) {
             toast({
                title: "Error",
                description: err.message || `Failed to ${isEditing ? 'update' : 'create'} webhook.`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <Input
                    id="webhook-url"
                    placeholder="https://yourapi.com/webhook"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    disabled={isLoading}
                 />
                <p className="text-xs text-muted-foreground">The HTTPS URL that will receive POST requests.</p>
            </div>

             <div className="space-y-2">
                 <Label htmlFor="webhook-description">Description (Optional)</Label>
                <Input
                    id="webhook-description"
                    placeholder="e.g., Send summary to Slack channel"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                />
                 <p className="text-xs text-muted-foreground">A short description for your reference.</p>
            </div>

            {!isEditing && (
                 <div className="flex items-center space-x-2">
                     <Checkbox
                        id="add-secret"
                        checked={addSecret}
                        onCheckedChange={(checked) => setAddSecret(checked as boolean)}
                        disabled={isLoading}
                    />
                    <Label htmlFor="add-secret" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Add a signing secret
                    </Label>
                </div>
             )}
              {addSecret && !isEditing && (
                  <p className="text-xs text-muted-foreground pl-6">
                     A secure secret will be generated. Use it to verify incoming requests using the <code>X-Webhook-Signature</code> header (HMAC-SHA256).
                 </p>
             )}


            <div className="flex justify-end space-x-3 pt-4">
                 <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isEditing ? 'Save Changes' : 'Create Webhook'}
                </Button>
            </div>
        </form>
    );
}