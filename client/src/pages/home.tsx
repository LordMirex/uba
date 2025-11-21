import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import avatarImage from "@assets/generated_images/friendly_3d_avatar_for_success_screen.png";
import { useToast } from "@/hooks/use-toast";

// --- Schema ---
const transferSchema = z.object({
  recipientName: z.string()
    .min(2, "Recipient name must be at least 2 characters")
    .max(100, "Recipient name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  amount: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0")
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), "Invalid amount format"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string()
    .regex(/^\d+$/, "Account number must be digits only")
    .min(6, "Account number must be at least 6 digits")
    .max(20, "Account number must be less than 20 digits"),
  note: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

export default function Home() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<TransferFormValues | null>(null);
  const { toast } = useToast();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipientName: "",
      amount: "",
      bankName: "",
      accountNumber: "",
      note: "",
    },
  });

  const onSubmit = (data: TransferFormValues) => {
    // Simulate API delay
    setTimeout(() => {
      setReceiptData(data);
      setIsSuccess(true);
    }, 500);
  };

  const handleShare = () => {
    if (!receiptData) return;
    
    const shareText = `I just transferred NGN${receiptData.amount} to ${receiptData.recipientName} (Bank: ${receiptData.bankName}, Account: ****${receiptData.accountNumber.slice(-4)})`;

    if (navigator.share) {
      navigator.share({
        title: 'Transfer Receipt',
        text: shareText,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        description: "Receipt details copied to clipboard.",
      });
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    form.reset();
    setReceiptData(null);
  };

  // Format currency with commas
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // --- Success Receipt View ---
  if (isSuccess && receiptData) {
    return (
      <div className="min-h-screen bg-black/50 flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-[400px] bg-white rounded-[24px] shadow-xl border-0 relative overflow-hidden">
          <button 
            onClick={handleClose}
            className="absolute top-6 right-6 text-gray-800 hover:text-gray-600 transition-colors"
            data-testid="button-close"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>

          <CardContent className="flex flex-col items-center pt-12 pb-8 px-8 text-center">
            {/* Avatar */}
            <div className="mb-6 relative">
               <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden mx-auto">
                  <img 
                    src={avatarImage} 
                    alt="Success Avatar" 
                    className="h-full w-full object-cover"
                    data-testid="img-avatar"
                  />
               </div>
            </div>

            {/* Heading */}
            <h2 className="text-[28px] font-bold text-gray-900 mb-6" data-testid="text-success-heading">
              Success
            </h2>

            {/* Body Text */}
            <div className="space-y-1.5 text-[17px] leading-snug text-gray-800 font-medium mb-10">
              <p>
                You have successfully <br />
                transferred NGN{formatCurrency(receiptData.amount)} to <br />
                {receiptData.recipientName}
              </p>
              <p>Bank Name: {receiptData.bankName}</p>
              <p>Account Number: {receiptData.accountNumber}</p>
            </div>

            {/* Buttons */}
            <div className="w-full space-y-4">
              <Button 
                className="w-full h-14 text-[19px] font-semibold bg-[#E60000] hover:bg-[#cc0000] text-white rounded-full shadow-none"
                onClick={handleClose}
                data-testid="button-ok"
              >
                OK
              </Button>
              
              <Button 
                className="w-full h-14 text-[19px] font-semibold bg-[#E60000] hover:bg-[#cc0000] text-white rounded-full shadow-none"
                onClick={handleShare}
                data-testid="button-share"
              >
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Transfer Form View ---
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md bg-white shadow-sm border border-gray-100">
        <CardContent className="pt-6 px-6 pb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Transfer Demo</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Recipient name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Oluwadamilola Deborah Idogbe" 
                        className="h-11 bg-gray-50 border-gray-200" 
                        data-testid="input-recipient-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Amount (NGN)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="20000" 
                        type="number" 
                        className="h-11 bg-gray-50 border-gray-200" 
                        data-testid="input-amount"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Bank name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200" data-testid="select-bank">
                          <SelectValue placeholder="Select a bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Opay">Opay</SelectItem>
                        <SelectItem value="GTBank">GTBank</SelectItem>
                        <SelectItem value="Zenith Bank">Zenith Bank</SelectItem>
                        <SelectItem value="Access Bank">Access Bank</SelectItem>
                        <SelectItem value="First Bank">First Bank</SelectItem>
                        <SelectItem value="Kuda">Kuda</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Account number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="7056172558" 
                        maxLength={20}
                        className="h-11 bg-gray-50 border-gray-200" 
                        data-testid="input-account-number"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-lg bg-[#E60000] hover:bg-[#cc0000] text-white mt-4"
                data-testid="button-submit"
              >
                Transfer
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
