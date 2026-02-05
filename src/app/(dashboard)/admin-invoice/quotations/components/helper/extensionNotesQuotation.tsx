import { Badge } from "@/components/ui/badge";
import { useWatch } from "react-hook-form";

export const NoteBadgeWatcher = ({
  control,
  categoryId,
}: {
  control: any;
  categoryId: string;
}) => {
  const notes = useWatch({ control, name: "notes" }) || [];
  const count =
    notes.find((n: any) => n.categoryId === categoryId)?.contents.length || 0;
  return count > 0 ? (
    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
      {count}
    </Badge>
  ) : null;
};

export const NoteItemWatcher = ({
  control,
  categoryId,
  content,
  children,
}: any) => {
  const notes = useWatch({ control, name: "notes" }) || [];
  const isSelected =
    notes
      .find((n: any) => n.categoryId === categoryId)
      ?.contents.includes(content) || false;
  return children(isSelected);
};
