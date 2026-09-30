import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  trigger: React.ReactElement;
  title: string;
  description: string;
  icon: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export function ConfirmationDialog({
  trigger,
  title,
  description,
  icon,
  cancelText = "No",
  confirmText = "Yes",
  onConfirm,
  isDestructive = true,
}: ConfirmationDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
        <div className="flex flex-col items-center justify-center gap-2 p-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-violet-50 text-violet-500 dark:bg-violet-950 dark:text-violet-400">
            {icon}
          </div>
          <AlertDialogTitle className="text-center font-semibold text-base">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="p-0 text-center font-medium text-sm">
            {description}
          </AlertDialogDescription>
        </div>
        <AlertDialogFooter className="grid w-full flex-none grid-cols-2 gap-0 divide-x border-t py-0">
          <AlertDialogCancel
            className="h-12 flex-1 rounded-none border-0 border-border border-r p-0"
            variant="ghost"
          >
            {cancelText}
          </AlertDialogCancel>
          <Button
            className="h-12 flex-1 rounded-none border-0 p-0 text-destructive hover:text-destructive"
            variant="ghost"
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
