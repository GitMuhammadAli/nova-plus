"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadsAPI } from "@/app/services";
import { toast } from "@/hooks/use-toast";
import {
  Upload,
  Search,
  Image as ImageIcon,
  File,
  Video,
  Music,
  Trash2,
  Eye,
  Download,
  Loader2,
  Grid3x3,
  List,
  Filter,
} from "lucide-react";

interface UploadFile {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  isPublic: boolean;
  category: string;
  createdAt: string;
  uploadedBy?: {
    name: string;
    email: string;
  };
}

export default function UploadsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedUpload, setSelectedUpload] = useState<UploadFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUploads();
  }, [categoryFilter]);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const response = await uploadsAPI.getAll({
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        search: search || undefined,
      });
      const data = response.data || response;
      setUploads(Array.isArray(data) ? data : data?.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load uploads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size exceeds 50MB limit",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", getCategoryFromMimeType(file.type));

    try {
      const response = await uploadsAPI.upload(formData);
      const data = response.data || response;
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      fetchUploads();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getCategoryFromMimeType = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "document";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await uploadsAPI.delete(id);
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
      fetchUploads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-8 h-8" />;
    if (mimeType.startsWith("video/")) return <Video className="w-8 h-8" />;
    if (mimeType.startsWith("audio/")) return <Music className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const filteredUploads = uploads.filter((upload) =>
    upload.filename.toLowerCase().includes(search.toLowerCase()) ||
    upload.originalName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-muted-foreground mt-1">
              Manage your uploaded files and media
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchUploads();
                }}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredUploads.length === 0 ? (
          <Card className="p-12 text-center">
            <File className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first file to get started
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUploads.map((upload) => (
              <Card key={upload._id} className="overflow-hidden group">
                <div className="aspect-square relative bg-muted">
                  {upload.thumbnailUrl || upload.mimeType.startsWith("image/") ? (
                    <img
                      src={upload.thumbnailUrl || upload.url}
                      alt={upload.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getFileIcon(upload.mimeType)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedUpload(upload);
                        setPreviewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(upload.url, "_blank")}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(upload._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{upload.filename}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(upload.size)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {upload.category}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">File</th>
                    <th className="text-left p-4">Category</th>
                    <th className="text-left p-4">Size</th>
                    <th className="text-left p-4">Uploaded</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUploads.map((upload) => (
                    <tr key={upload._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(upload.mimeType)}
                          <div>
                            <p className="font-medium">{upload.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {upload.originalName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{upload.category}</Badge>
                      </td>
                      <td className="p-4">{formatFileSize(upload.size)}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUpload(upload);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(upload.url, "_blank")}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(upload._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedUpload?.filename}</DialogTitle>
            </DialogHeader>
            {selectedUpload && (
              <div className="space-y-4">
                {selectedUpload.mimeType.startsWith("image/") ? (
                  <img
                    src={selectedUpload.url}
                    alt={selectedUpload.filename}
                    className="w-full max-h-[60vh] object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                    {getFileIcon(selectedUpload.mimeType)}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Original Name</p>
                    <p className="font-medium">{selectedUpload.originalName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="font-medium">{formatFileSize(selectedUpload.size)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedUpload.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uploaded</p>
                    <p className="font-medium">
                      {new Date(selectedUpload.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedUpload.url, "_blank")}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDelete(selectedUpload._id);
                      setPreviewOpen(false);
                    }}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

