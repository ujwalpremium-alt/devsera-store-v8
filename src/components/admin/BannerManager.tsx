import { useState } from 'react';
import { 
  Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, RefreshCw, 
  Sparkles, Gift, Clock, Shield, Zap, Star, Heart, Crown, 
  Image as ImageIcon, Link, Calendar, ChevronUp, ChevronDown,
  ExternalLink, Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAdminBannerPosts, BannerPost } from '@/hooks/useBannerPosts';

const ICON_OPTIONS = [
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'gift', label: 'Gift', icon: Gift },
  { value: 'clock', label: 'Clock', icon: Clock },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'crown', label: 'Crown', icon: Crown },
];

const GRADIENT_OPTIONS = [
  { value: 'from-teal-600 via-teal-700 to-emerald-800', label: 'Teal', preview: 'bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-800' },
  { value: 'from-purple-600 via-pink-600 to-purple-800', label: 'Purple Pink', preview: 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800' },
  { value: 'from-amber-500 via-orange-500 to-red-600', label: 'Amber Orange', preview: 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600' },
  { value: 'from-blue-600 via-indigo-600 to-purple-700', label: 'Blue Indigo', preview: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700' },
  { value: 'from-green-500 via-emerald-500 to-teal-600', label: 'Green Emerald', preview: 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600' },
  { value: 'from-rose-500 via-pink-500 to-fuchsia-600', label: 'Rose Pink', preview: 'bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-600' },
  { value: 'from-cyan-500 via-blue-500 to-indigo-600', label: 'Cyan Blue', preview: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600' },
  { value: 'from-yellow-500 via-amber-500 to-orange-600', label: 'Yellow Amber', preview: 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-600' },
];

const getIconComponent = (iconType: string) => {
  const iconOption = ICON_OPTIONS.find(opt => opt.value === iconType);
  if (iconOption) {
    const IconComponent = iconOption.icon;
    return <IconComponent className="h-6 w-6" />;
  }
  return <Sparkles className="h-6 w-6" />;
};

export function BannerManager() {
  const { toast } = useToast();
  const { banners, isLoading, refetch, createBanner, updateBanner, deleteBanner, toggleBannerStatus, reorderBanners } = useAdminBannerPosts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    button_text: 'Shop Now',
    button_link: '/',
    gradient: 'from-teal-600 via-teal-700 to-emerald-800',
    icon_type: 'sparkles',
    image_url: '',
    is_active: true,
    start_date: '',
    end_date: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      button_text: 'Shop Now',
      button_link: '/',
      gradient: 'from-teal-600 via-teal-700 to-emerald-800',
      icon_type: 'sparkles',
      image_url: '',
      is_active: true,
      start_date: '',
      end_date: '',
    });
    setEditingBanner(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (banner: BannerPost) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      button_text: banner.button_text,
      button_link: banner.button_link,
      gradient: banner.gradient,
      icon_type: banner.icon_type,
      image_url: banner.image_url || '',
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const bannerData = {
        ...formData,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      };

      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerData);
        toast({ title: 'Success', description: 'Banner updated successfully' });
      } else {
        await createBanner(bannerData);
        toast({ title: 'Success', description: 'Banner created successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to save banner', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      await deleteBanner(id);
      toast({ title: 'Deleted', description: 'Banner deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete banner', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleBannerStatus(id, !currentStatus);
      toast({ title: 'Updated', description: `Banner ${!currentStatus ? 'activated' : 'deactivated'}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...banners];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    await reorderBanners(newOrder.map(b => b.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index === banners.length - 1) return;
    const newOrder = [...banners];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await reorderBanners(newOrder.map(b => b.id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-teal-600" />
            Banner / Ad Post Manager
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage the auto-scrolling banners on the front page
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} className="border-2 border-gray-300">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={openCreateDialog} className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
            <Plus className="h-4 w-4 mr-1" />
            Add Banner
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="brutalist-card p-4 border-teal-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Banners</p>
          <p className="text-2xl font-bold text-teal-600">{banners.length}</p>
        </div>
        <div className="brutalist-card p-4 border-green-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-600">{banners.filter(b => b.is_active).length}</p>
        </div>
        <div className="brutalist-card p-4 border-gray-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">Inactive</p>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{banners.filter(b => !b.is_active).length}</p>
        </div>
        <div className="brutalist-card p-4 border-purple-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled</p>
          <p className="text-2xl font-bold text-purple-600">{banners.filter(b => b.start_date || b.end_date).length}</p>
        </div>
      </div>

      {/* Banner List */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <div className="text-center py-12 brutalist-card">
            <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No banners yet. Create your first banner!</p>
          </div>
        ) : (
          banners.map((banner, index) => (
            <div 
              key={banner.id} 
              className={`brutalist-card p-4 ${banner.is_active ? 'border-green-500' : 'border-gray-300 opacity-60'}`}
            >
              <div className="flex items-start gap-4">
                {/* Drag Handle & Order Controls */}
                <div className="flex flex-col items-center gap-1">
                  <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-500 cursor-grab" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{index + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleMoveDown(index)}
                    disabled={index === banners.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Preview */}
                <div className={`w-24 h-16 rounded-lg bg-gradient-to-br ${banner.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                  {getIconComponent(banner.icon_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{banner.title}</h3>
                    {banner.is_active ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                    {(banner.start_date || banner.end_date) && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Scheduled
                      </Badge>
                    )}
                  </div>
                  {banner.subtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{banner.subtitle}</p>
                  )}
                  {banner.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{banner.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Link className="h-3 w-3" />
                      {banner.button_link}
                    </span>
                    <span className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {banner.button_text}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(banner.id, banner.is_active)}
                    className={banner.is_active ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}
                  >
                    {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(banner)}
                    className="text-blue-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(banner.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-teal-600" />
              {editingBanner ? 'Edit Banner' : 'Create New Banner'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Preview */}
            <div className={`rounded-xl p-6 bg-gradient-to-br ${formData.gradient} text-white shadow-lg`}>
              <div className="flex items-center gap-3 mb-2">
                {getIconComponent(formData.icon_type)}
                <div>
                  <h3 className="font-bold text-lg">{formData.title || 'Banner Title'}</h3>
                  {formData.subtitle && <p className="text-sm opacity-90">{formData.subtitle}</p>}
                </div>
              </div>
              {formData.description && (
                <p className="text-sm opacity-80 mb-3">{formData.description}</p>
              )}
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white">
                {formData.button_text || 'Shop Now'}
              </Button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Premium Services"
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Unbeatable Prices"
                  className="border-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Get instant access to premium services at amazing prices!"
                className="border-2"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder="Shop Now"
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={formData.button_link}
                  onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                  placeholder="/"
                  className="border-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Gradient Color
                </Label>
                <Select
                  value={formData.gradient}
                  onValueChange={(value) => setFormData({ ...formData, gradient: value })}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADIENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-4 rounded ${opt.preview}`} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={formData.icon_type}
                  onValueChange={(value) => setFormData({ ...formData, icon_type: value })}
                >
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => {
                      const IconComp = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <IconComp className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image URL (Optional)</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="border-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Date (Optional)
                </Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  End Date (Optional)
                </Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-semibold">Active Status</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enable to show this banner on the front page</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                editingBanner ? 'Update Banner' : 'Create Banner'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
