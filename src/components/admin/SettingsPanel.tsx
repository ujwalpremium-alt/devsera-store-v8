import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Update local settings when settings load
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
      console.error('Error saving settings:', error);
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, GIF, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 15, 90));
    }, 100);

    try {
      const url = await uploadQrCode(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setLocalSettings({ ...localSettings!, qrCodeUrl: url });
      toast({
        title: 'QR Code uploaded!',
        description: 'Click Save Settings to apply changes.',
      });
    } catch (error: any) {
      clearInterval(progressInterval);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCopyUpi = () => {
    if (localSettings?.upiId) {
      navigator.clipboard.writeText(localSettings.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'UPI ID copied to clipboard',
      });
    }
  };

  const handleRemoveQrCode = () => {
    setLocalSettings({ ...localSettings!, qrCodeUrl: '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-[#0A7A7A]" />
        <span className="ml-3 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
      <CardHeader className="border-b-2 border-black bg-gradient-to-r from-teal-50 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold font-['Space_Grotesk'] text-gray-900">
              Platform Settings
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Configure payment details and contact information
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="border-2 border-black hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#0A7A7A] hover:bg-[#086666] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Form */}
          <div className="space-y-6">
            {/* Payment Information */}
            <div className="border-2 border-black rounded-lg p-6 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold font-['Space_Grotesk'] text-lg mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#0A7A7A]" />
                Payment Information
              </h3>
              <div className="space-y-5">
                {/* UPI ID */}
                <div>
                  <Label htmlFor="upi-id" className="font-medium text-gray-900">
                    UPI ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <div className="relative flex-1">
                      <Input
                        id="upi-id"
                        value={localSettings?.upiId || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings!, upiId: e.target.value })}
                        className="border-2 border-black font-mono pr-10 focus:border-[#0A7A7A]"
                        placeholder="yourname@upi"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-2 border-black hover:bg-gray-100"
                      onClick={handleCopyUpi}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    This UPI ID will be shown to customers for payment
                  </p>
                </div>

                {/* QR Code */}
                <div>
                  <Label className="font-medium text-gray-900">
                    Payment QR Code
                  </Label>
                  <div className="mt-1.5 space-y-3">
                    {/* QR Preview */}
                    {localSettings?.qrCodeUrl && (
                      <div className="relative inline-block">
                        <img
                          src={localSettings.qrCodeUrl}
                          alt="QR Code Preview"
                          className="w-32 h-32 object-contain rounded-lg border-2 border-black bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveQrCode}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Upload Section */}
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleQrUpload}
                        accept="image/*"
                        className="hidden"
                        id="qr-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full border-2 border-dashed border-gray-400 hover:border-[#0A7A7A] hover:bg-teal-50 h-20 flex flex-col items-center justify-center gap-1"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="h-5 w-5 animate-spin text-[#0A7A7A]" />
                            <span className="text-sm">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-gray-500" />
                            <span className="text-sm text-gray-600">Click to upload QR code</span>
                            <span className="text-xs text-gray-400">Max 5MB (JPG, PNG, GIF)</span>
                          </>
                        )}
                      </Button>
                      {isUploading && (
                        <Progress value={uploadProgress} className="mt-2 h-2" />
                      )}
                    </div>

                    {/* URL Input */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <div className="relative">
                      <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={localSettings?.qrCodeUrl || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings!, qrCodeUrl: e.target.value })}
                        placeholder="Paste QR code image URL here..."
                        className="pl-10 border-2 border-black focus:border-[#0A7A7A]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-2 border-black rounded-lg p-6 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold font-['Space_Grotesk'] text-lg mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#0A7A7A]" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="telegram" className="font-medium text-gray-900">
                    Telegram Support Link
                  </Label>
                  <div className="relative mt-1.5">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="telegram"
                      value={localSettings?.telegramLink || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings!, telegramLink: e.target.value })}
                      className="pl-10 border-2 border-black focus:border-[#0A7A7A]"
                      placeholder="https://t.me/yourusername"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="telegramUsername" className="font-medium text-gray-900">
                    Telegram Username (for direct contact)
                  </Label>
                  <div className="relative mt-1.5">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="telegramUsername"
                      value={localSettings?.telegramUsername || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings!, telegramUsername: e.target.value })}
                      className="pl-10 border-2 border-black focus:border-[#0A7A7A]"
                      placeholder="@yourusername"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This username will be shown to customers for direct contact during checkout</p>
                </div>
                <div>
                  <Label htmlFor="email" className="font-medium text-gray-900">
                    Contact Email
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={localSettings?.contactEmail || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings!, contactEmail: e.target.value })}
                      className="pl-10 border-2 border-black focus:border-[#0A7A7A]"
                      placeholder="support@yourstore.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="font-medium text-gray-900">
                    Contact Phone
                  </Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={localSettings?.contactPhone || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings!, contactPhone: e.target.value })}
                      className="pl-10 border-2 border-black focus:border-[#0A7A7A]"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            {/* Payment Preview */}
            <div className="border-2 border-black rounded-lg p-6 bg-gradient-to-br from-white to-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold font-['Space_Grotesk'] text-lg mb-2 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-[#0A7A7A]" />
                Payment Preview
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                This is how customers will see your payment details
              </p>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-3">QR Code</p>
                  <div className="inline-block">
                    {localSettings?.qrCodeUrl ? (
                      <div className="relative">
                        <img
                          src={localSettings.qrCodeUrl}
                          alt="QR Code Preview"
                          className="w-52 h-52 border-4 border-black object-contain bg-white rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        />
                      </div>
                    ) : (
                      <div className="w-52 h-52 border-4 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center rounded-lg">
                        <QrCode className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">No QR Code</p>
                        <p className="text-xs text-gray-400">Upload one above</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-black">
                  <p className="text-sm text-gray-500 mb-1">UPI ID</p>
                  <p className="font-mono font-bold text-xl text-[#0A7A7A]">
                    {localSettings?.upiId || 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Preview */}
            <div className="border-2 border-black rounded-lg p-6 bg-gradient-to-br from-white to-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold font-['Space_Grotesk'] text-lg mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#0A7A7A]" />
                Contact Preview
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telegram</p>
                      <p className="font-medium text-gray-900">
                        {localSettings?.telegramLink ? 'Configured' : 'Not set'}
                      </p>
                    </div>
                  </div>
                  {localSettings?.telegramLink && (
                    <a
                      href={localSettings.telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0A7A7A] hover:underline flex items-center gap-1 text-sm font-medium"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">
                        {localSettings?.contactEmail || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">
                        {localSettings?.contactPhone || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Remember to save</p>
                <p className="text-xs text-amber-700 mt-1">
                  Changes won't take effect until you click the "Save Settings" button.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
