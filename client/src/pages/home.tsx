import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import avatarImage from "@assets/images~2_1763755363341.png";
import { useToast } from "@/hooks/use-toast";
import { nigerianBanks } from "@/data/nigerian-banks";

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
});

type TransferFormValues = z.infer<typeof transferSchema>;

export default function Home() {
  const [receiptData, setReceiptData] = useState<TransferFormValues | null>(null);
  const [openBankSelector, setOpenBankSelector] = useState(false);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipientName: "",
      amount: "",
      bankName: "",
      accountNumber: "",
    },
  });

  const onSubmit = (data: TransferFormValues) => {
    setReceiptData(data);
  };

  // Generate receipt canvas when receipt data changes
  useEffect(() => {
    if (receiptData && canvasRef.current) {
      generateReceiptCanvas();
    }
  }, [receiptData]);

  const generateReceiptCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !receiptData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - compact layout
    canvas.width = 390;
    canvas.height = 480;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw close X button in top right
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const xSize = 14;
    const xPadding = 18;
    ctx.beginPath();
    ctx.moveTo(canvas.width - xPadding - xSize, xPadding);
    ctx.lineTo(canvas.width - xPadding, xPadding + xSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width - xPadding, xPadding);
    ctx.lineTo(canvas.width - xPadding - xSize, xPadding + xSize);
    ctx.stroke();

    // Load and draw avatar image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Draw avatar centered
      const avatarSize = 90;
      const avatarX = (canvas.width - avatarSize) / 2;
      const avatarY = 35;
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);

      // Draw "Success" heading
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Success', canvas.width / 2, avatarY + avatarSize + 50);

      // Draw transfer details - left aligned with tight spacing
      ctx.font = '400 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      
      const textX = 25;
      let textY = avatarY + avatarSize + 95;
      const lineHeight = 20;

      // Format amount with commas
      const amount = parseFloat(receiptData.amount).toLocaleString('en-NG', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      });

      // Multi-line text
      ctx.fillText('You have successfully', textX, textY);
      textY += lineHeight;
      ctx.fillText(`transferred NGN${amount} to`, textX, textY);
      textY += lineHeight;
      ctx.fillText(receiptData.recipientName.toUpperCase(), textX, textY);
      textY += lineHeight + 2;
      ctx.fillText(`Bank Name: ${receiptData.bankName}`, textX, textY);
      textY += lineHeight;
      ctx.fillText(`Account Number: ${receiptData.accountNumber}`, textX, textY);
    };
    img.src = avatarImage;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transfer-receipt-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Receipt downloaded",
          description: "Your transfer receipt has been saved.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-4 font-sans">
      <Card className="w-full max-w-md bg-white shadow-sm border border-gray-100 mt-8">
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
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-gray-700">Bank name</FormLabel>
                    <Popover open={openBankSelector} onOpenChange={setOpenBankSelector}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "h-11 bg-gray-50 border-gray-200 justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="select-bank"
                          >
                            {field.value || "Select a bank"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search bank..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No bank found.</CommandEmpty>
                            <CommandGroup>
                              {nigerianBanks.map((bank) => (
                                <CommandItem
                                  key={bank.code}
                                  value={bank.name}
                                  onSelect={() => {
                                    form.setValue("bankName", bank.name);
                                    setOpenBankSelector(false);
                                  }}
                                >
                                  {bank.name}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      field.value === bank.name
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                Generate Receipt
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Canvas Preview */}
      {receiptData && (
        <Card className="w-full max-w-md bg-white shadow-sm border border-gray-100 mt-6">
          <CardContent className="pt-6 px-6 pb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Receipt Preview</h2>
            <div className="flex justify-center mb-4">
              <canvas 
                ref={canvasRef}
                className="border border-gray-200 rounded-lg max-w-full h-auto"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
            <Button
              onClick={handleDownload}
              className="w-full h-12 text-lg bg-[#E60000] hover:bg-[#cc0000] text-white"
              data-testid="button-download"
            >
              Download Receipt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
