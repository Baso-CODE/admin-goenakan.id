"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/useApi";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClipboardList,
  ImagePlus,
  Loader2,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// ==========================================
// SCHEMA
// ==========================================

const userSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),

  email: z.string().trim().email("Invalid email format"),

  password: z.string(),

  roleId: z.string().min(1, "Please select a role"),

  imageFile: z.any().optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

// ==========================================
// TYPES
// ==========================================

interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

interface UserFormInitialData {
  name: string;
  email: string;
  password?: string;
  roleId: string;
  image?: string | null;
}

interface UserFormProps {
  onSubmit: (data: UserFormValues, file?: File) => void | Promise<void>;

  isSubmitting?: boolean;

  isEdit?: boolean;

  initialData?: UserFormInitialData;
}

// ==========================================
// COMPONENT
// ==========================================

export default function UserForm({
  onSubmit,
  isSubmitting = false,
  isEdit = false,
  initialData,
}: UserFormProps) {
  const { fetchApi, status } = useApi();

  // ==========================================
  // STATE
  // ==========================================

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null,
  );

  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const [roles, setRoles] = useState<RoleOption[]>([]);

  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // ==========================================
  // FORM
  // ==========================================

  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      userSchema.superRefine((values, ctx) => {
        if (!isEdit && values.password.length < 6) {
          ctx.addIssue({
            code: "custom",
            path: ["password"],
            message: "Password must be at least 6 characters",
          });
        }

        if (
          isEdit &&
          values.password.length > 0 &&
          values.password.length < 6
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["password"],
            message: "Password must be at least 6 characters",
          });
        }
      }),
    ) as Resolver<UserFormValues>,

    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      password: "",
      roleId: initialData?.roleId || "",
      imageFile: undefined,
    },

    mode: "onBlur",
  });

  // ==========================================
  // SYNC INITIAL DATA
  // ==========================================

  const initialName = initialData?.name;
  const initialEmail = initialData?.email;
  const initialRoleId = initialData?.roleId;
  const initialImage = initialData?.image;

  useEffect(() => {
    if (!isEdit || !initialData) return;

    form.reset({
      name: initialName || "",
      email: initialEmail || "",
      password: "",
      roleId: initialRoleId || "",
      imageFile: undefined,
    });
  }, [isEdit, initialName, initialEmail, initialRoleId, form]);

  // ==========================================
  // IMAGE PREVIEW
  // ==========================================

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedFile) {
      setImagePreview(initialImage || null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile, initialImage]);

  // ==========================================
  // FETCH ROLES
  // ==========================================

  useEffect(() => {
    const fetchRoles = async () => {
      if (status !== "authenticated") {
        if (status === "unauthenticated") {
          setIsLoadingRoles(false);
        }

        return;
      }

      try {
        setIsLoadingRoles(true);

        const res = await fetchApi("/roles/list");

        if (!res.ok) {
          throw new Error("Failed to fetch roles");
        }

        const result = await res.json();

        const roleData = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
            ? result.data
            : [];

        setRoles(roleData);
      } catch (error) {
        console.error("[Fetch Roles Error]", error);

        toast.error("Gagal memuat daftar role");
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [status, fetchApi]);

  // ==========================================
  // HANDLE FILE CHANGE
  // ==========================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldChange: (value: File | undefined) => void,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    fieldChange(file);

    event.target.value = "";
  };

  // ==========================================
  // REMOVE SELECTED IMAGE
  // ==========================================

  const handleRemoveImage = (
    fieldChange: (value: File | undefined) => void,
  ) => {
    setSelectedFile(undefined);

    fieldChange(undefined);

    setImagePreview(initialData?.image || null);
  };

  // ==========================================
  // HANDLE SUBMIT
  // ==========================================

  const handleSubmit = async (values: UserFormValues) => {
    await onSubmit(values, selectedFile);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Card className="w-full relative shadow-sm">
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ==================================
                  PROFILE IMAGE
              ================================== */}

              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="imageFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 mb-2">
                        <ImagePlus className="h-4 w-4 text-blue-600" />
                        Profile Picture (Optional)
                      </FormLabel>

                      <FormControl>
                        <div className="space-y-3">
                          {imagePreview ? (
                            <div className="relative w-32 h-32 bg-slate-100 rounded-full overflow-hidden border border-border group shadow-sm mx-auto md:mx-0">
                              <Image
                                src={imagePreview}
                                alt="Profile Preview"
                                fill
                                unoptimized
                                className="object-cover"
                              />

                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() =>
                                    handleRemoveImage(field.onChange)
                                  }
                                  className="text-white bg-red-500 rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                                  title="Cancel selected image">
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-full cursor-pointer bg-gray-50/50 hover:bg-gray-100/80 border-gray-300 hover:border-blue-400 transition-all mx-auto md:mx-0">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />

                                <p className="text-[10px] text-gray-500 font-medium">
                                  Upload
                                  <br />
                                  Photo
                                </p>
                              </div>

                              <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={isSubmitting}
                                onChange={(event) =>
                                  handleFileChange(event, field.onChange)
                                }
                              />
                            </label>
                          )}

                          {imagePreview && (
                            <label className="inline-flex cursor-pointer text-xs text-blue-600 hover:underline">
                              Change Photo
                              <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={isSubmitting}
                                onChange={(event) =>
                                  handleFileChange(event, field.onChange)
                                }
                              />
                            </label>
                          )}

                          {isEdit && initialData?.image && !selectedFile && (
                            <p className="text-xs text-muted-foreground">
                              Current profile picture
                            </p>
                          )}
                        </div>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ==================================
                  NAME
              ================================== */}

              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Full Name *
                      </FormLabel>

                      <FormControl>
                        <Input
                          placeholder="Ex: John Doe"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ==================================
                  EMAIL
              ================================== */}

              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email Address *
                      </FormLabel>

                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Ex: john@company.com"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ==================================
                  PASSWORD
              ================================== */}

              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />

                        {isEdit
                          ? "New Password (Optional)"
                          : "Temporary Password *"}
                      </FormLabel>

                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder={
                            isEdit
                              ? "Leave blank to keep current password"
                              : "Min. 6 characters"
                          }
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>

                      {isEdit && (
                        <p className="text-xs text-muted-foreground">
                          Kosongkan jika tidak ingin mengganti password.
                        </p>
                      )}

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ==================================
                  ROLE
              ================================== */}

              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        Assign Role *
                      </FormLabel>

                      <Select
                        disabled={isLoadingRoles || isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingRoles
                                  ? "Loading roles..."
                                  : "Select a role"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ==================================
                SUBMIT BUTTON
            ================================== */}

            <div className="flex justify-end pt-4 border-t mt-6">
              <Button
                type="submit"
                className="w-full md:w-auto cursor-pointer"
                disabled={
                  isSubmitting || isLoadingRoles || form.formState.isSubmitting
                }>
                {isSubmitting || form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isEdit ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}

                {isSubmitting
                  ? isEdit
                    ? "Updating..."
                    : "Creating..."
                  : isEdit
                    ? "Update User"
                    : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
