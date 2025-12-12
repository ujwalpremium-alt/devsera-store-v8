import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Save, Upload, Copy, CheckCircle2, RefreshCw, CreditCard, MessageCircle, Mail, Phone, QrCode, X, ImageIcon, ExternalLink, AlertCircle } from 'lucide-react';

export function SettingsPanel() {
  const { settings, updateSettings, uploadQrCode, isLoading, refetch } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      toast({
        title: 'Settings saved!',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Max 5MB allowed',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 15, 90));
    }, 100);

    try {
      const url = await uploadQrCode(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setLocalSettings({ ...localSettings!, qrCodeUrl: url });
      toast({ title: 'QR Code uploaded!' });
    } catch (error: any) {
      clearInterval(progressInterval);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyUpi = () => {
    if (localSettings?.upiId) {
      navigator.clipboard.writeText(localSettings.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied!' });
    }
  };

  const handleRemoveQrCode = () => {
    setLocalSettings({ ...localSettings!, qrCodeUrl: '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Payment & contact configuration</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="h-8 px-3 text-gray-600 dark:text-gray-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="h-8 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-4">
          {/* Payment Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Payment</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* UPI ID */}
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">UPI ID</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={localSettings?.upiId || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings!, upiId: e.target.value })}
                    className="h-9 text-sm font-mono border-gray-200 dark:border-gray-700"
                    placeholder="yourname@upi"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-9 w-9 p-0 border-gray-200 dark:border-gray-700"
                    onClick={handleCopyUpi}
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">QR Code</Label>
                <div className="mt-1.5 flex gap-3">
                  {localSettings?.qrCodeUrl ? (
                    <div className="relative">
                      <img
                        src={localSettings.qrCodeUrl}
                        alt="QR"
                        className="w-20 h-20 object-contain rounded border border-gray-200 dark:border-gray-700 bg-white"
                      />
                      <button
                        onClick={handleRemoveQrCode}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleQrUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full h-20 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    >
                      {isUploading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="text-center">
                          <Upload className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                          <span className="text-xs text-gray-500">Upload QR</span>
                        </div>
                      )}
                    </Button>
                    {isUploading && <Progress value={uploadProgress} className="mt-2 h-1" />}
                  </div>
                </div>
                <Input
                  value={localSettings?.qrCodeUrl || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings!, qrCodeUrl: e.target.value })}
                  placeholder="Or paste image URL..."
                  className="mt-2 h-9 text-sm border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Contact</h3>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Telegram Link</Label>
                <Input
                  value={localSettings?.telegramLink || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings!, telegramLink: e.target.value })}
                  className="mt-1.5 h-9 text-sm border-gray-200 dark:border-gray-700"
                  placeholder="https://t.me/username"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Telegram Username</Label>
                <Input
                  value={localSettings?.telegramUsername || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings!, telegramUsername: e.target.value })}
                  className="mt-1.5 h-9 text-sm border-gray-200 dark:border-gray-700"
                  placeholder="@username"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Email</Label>
                <Input
                  type="email"
                  value={localSettings?.contactEmail || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings!, contactEmail: e.target.value })}
                  className="mt-1.5 h-9 text-sm border-gray-200 dark:border-gray-700"
                  placeholder="support@store.com"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Phone</Label>
                <Input
                  value={localSettings?.contactPhone || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings!, contactPhone: e.target.value })}
                  className="mt-1.5 h-9 text-sm border-gray-200 dark:border-gray-700"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4">
          {/* Payment Preview */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Preview</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="text-center mb-3">
                {localSettings?.qrCodeUrl ? (
                  <img
                    src={localSettings.qrCodeUrl}
                    alt="QR"
                    className="w-32 h-32 mx-auto object-contain border border-gray-200 dark:border-gray-700 rounded bg-white"
                  />
                ) : (
                  <div className="w-32 h-32 mx-auto border-2 border-dashed border-gray-200 dark:border-gray-700 rounded flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">UPI ID</p>
                <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                  {localSettings?.upiId || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Preview */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Contact Info</h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                  {localSettings?.telegramLink || '—'}
                </span>
                {localSettings?.telegramLink && (
                  <a href={localSettings.telegramLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                <Mail className="h-3.5 w-3.5 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {localSettings?.contactEmail || '—'}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                <Phone className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {localSettings?.contactPhone || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Click Save to apply changes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
