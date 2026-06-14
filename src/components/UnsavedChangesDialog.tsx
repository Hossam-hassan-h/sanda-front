import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  onSaveAndClose: () => void;
  isSaving?: boolean;
}

export default function UnsavedChangesDialog({
  open,
  onKeepEditing,
  onDiscard,
  onSaveAndClose,
  isSaving,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent dir="rtl" className="text-right">
        <AlertDialogHeader>
          <AlertDialogTitle>لديك تغييرات غير محفوظة</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد أنك تريد المغادرة؟ سيتم فقدان التغييرات إذا لم تقم بحفظها.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onKeepEditing} disabled={isSaving}>
            استمرار التعديل
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDiscard}
            disabled={isSaving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            تجاهل التغييرات
          </AlertDialogAction>
          <AlertDialogAction onClick={onSaveAndClose} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            حفظ وإغلاق
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
