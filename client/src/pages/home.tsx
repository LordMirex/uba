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
import { Check, ChevronsUpDown, ArrowLeft, Smartphone, Send } from "lucide-react";
import mtnLogo from "@assets/cropped_circle_image_(1)_1767256543970.png";
import gloLogo from "@assets/cropped_circle_image_(2)_1767256543970.png";
import airtelLogo from "@assets/cropped_circle_image_(3)_1767256543970.png";
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

const airtimeSchema = z.object({
  network: z.enum(["MTN", "Glo", "Airtel"]),
  phoneNumber: z.string()
    .regex(/^\d+$/, "Phone number must be digits only")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits"),
  amount: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0")
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(val), "Invalid amount format"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

type TransferFormValues = z.infer<typeof transferSchema>;
type AirtimeFormValues = z.infer<typeof airtimeSchema>;

type AppMode = "landing" | "uba" | "opay";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("landing");
  const [receiptData, setReceiptData] = useState<TransferFormValues | AirtimeFormValues | null>(null);
  const [openBankSelector, setOpenBankSelector] = useState(false);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipientName: "",
      amount: "",
      bankName: "",
      accountNumber: "",
    },
  });

  const airtimeForm = useForm<AirtimeFormValues>({
    resolver: zodResolver(airtimeSchema),
    defaultValues: {
      network: "MTN",
      phoneNumber: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5),
    },
  });

  const onTransferSubmit = (data: TransferFormValues) => {
    setReceiptData(data);
  };

  const onAirtimeSubmit = (data: AirtimeFormValues) => {
    setReceiptData(data);
  };

  // Generate receipt canvas when receipt data changes
  useEffect(() => {
    if (receiptData && canvasRef.current) {
      if (mode === "uba") {
        generateUBAReceiptCanvas();
      } else if (mode === "opay") {
        generateOPReceiptCanvas();
      }
    }
  }, [receiptData]);

  const generateUBAReceiptCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !receiptData || mode !== "uba") return;
    const data = receiptData as TransferFormValues;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed High-DPI scaling for device-independent perfect output
    const scale = 2;
    canvas.width = 390 * scale;
    canvas.height = 360 * scale;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 390, 360);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const xSize = 14;
    const xPadding = 18;
    ctx.beginPath();
    ctx.moveTo(390 - xPadding - xSize, xPadding);
    ctx.lineTo(390 - xPadding, xPadding + xSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(390 - xPadding, xPadding);
    ctx.lineTo(390 - xPadding - xSize, xPadding + xSize);
    ctx.stroke();

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const avatarSize = 110;
      const avatarX = (390 - avatarSize) / 2;
      const avatarY = 30;
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Success', 390 / 2, avatarY + avatarSize + 50);

      ctx.font = '400 16px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      
      const textX = 25;
      let textY = avatarY + avatarSize + 95;
      const lineHeight = 20;

      const amount = parseFloat(data.amount).toLocaleString('en-NG', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      });

      ctx.fillText('You have successfully', textX, textY);
      textY += lineHeight;
      ctx.fillText(`transferred NGN${amount} to`, textX, textY);
      textY += lineHeight;
      ctx.fillText(data.recipientName.toUpperCase(), textX, textY);
      textY += lineHeight + 2;
      ctx.fillText(`Bank Name: ${data.bankName}`, textX, textY);
      textY += lineHeight;
      ctx.fillText(`Account Number: ${data.accountNumber}`, textX, textY);
    };
    img.src = avatarImage;
  };

  const generateOPReceiptCanvas = () => {
    // Preload logos locally to ensure they're available
    [mtnLogo, gloLogo, airtelLogo].forEach(src => {
      const img = new Image();
      img.src = src;
    });

    const canvas = canvasRef.current;
    if (!canvas || !receiptData || mode !== "opay") return;
    const data = receiptData as AirtimeFormValues;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed High-DPI scaling for device-independent perfect output
    const scale = 2;
    canvas.width = 390 * scale; 
    canvas.height = 580 * scale;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#f2f3f7';
    ctx.fillRect(0, 0, 390, 580);

    // Main Card (Top)
    const cardMargin = 14;
    const cardWidth = 390 - (cardMargin * 2);
    
    // Draw shadows/borders for cards
    ctx.shadowColor = 'rgba(0, 0, 0, 0.02)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 1;

    // Accurately positioned Background Shapes
    ctx.fillStyle = '#ffffff';
    // Top rounded card
    ctx.beginPath();
    ctx.roundRect(cardMargin, 55, cardWidth, 230, 12);
    ctx.fill();
    
    // Bottom detail card
    ctx.beginPath();
    ctx.roundRect(cardMargin, 300, cardWidth, 285, 12);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const centerX = 390 / 2;

    // Restore the perfect indicator circle background
    ctx.beginPath();
    ctx.arc(centerX, 55, 26, 0, Math.PI * 2);
    if (data.network === "MTN") ctx.fillStyle = "#ffcc00";
    else if (data.network === "Glo") ctx.fillStyle = "#4caf50";
    else ctx.fillStyle = "#e60000";
    ctx.fill();

    // Precise Network Logo Placement - NO DESIGN, JUST REFERENCE IMAGE
    const drawNetworkLogo = () => {
      const logoSize = 52; // Full size of the 26px radius circle
      const logoX = centerX - (logoSize / 2);
      const logoY = 55 - (logoSize / 2);

      let logoSrc = "";
      if (data.network === "MTN") logoSrc = mtnLogo;
      else if (data.network === "Glo") logoSrc = gloLogo;
      else if (data.network === "Airtel") logoSrc = airtelLogo;

      if (logoSrc) {
        const logoImg = new Image();
        logoImg.onload = () => {
          ctx.save();
          // Clip to the circle to ensure no bleed
          ctx.beginPath();
          ctx.arc(centerX, 55, 26, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          ctx.restore();
          
          // Force a re-render or notification if needed, but since we're drawing 
          // directly to canvas in an effect-like flow, it should be fine.
        };
        // Check if image is already cached
        logoImg.src = logoSrc;
        if (logoImg.complete) {
          logoImg.onload(null as any);
        }
      }
    };

    drawNetworkLogo();

    ctx.fillStyle = '#111827';
    ctx.font = '400 14.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '0.2px';
    ctx.fillText(data.network, centerX, 108);

    const amountValue = parseFloat(data.amount).toLocaleString('en-NG', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });

    ctx.fillStyle = '#111827';
    ctx.font = '700 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`₦${amountValue}`, centerX, 160);

    // Successful checkmark + text
    ctx.fillStyle = '#0fb47a';
    ctx.beginPath();
    ctx.arc(centerX - 52, 202, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX - 56, 202);
    ctx.lineTo(centerX - 53, 206);
    ctx.lineTo(centerX - 48, 198);
    ctx.stroke();

    ctx.fillStyle = '#0fb47a';
    ctx.font = '500 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Successful', centerX - 36, 208);

    // Bonus Earned row (Refined position and color)
    ctx.fillStyle = '#8e94a3';
    ctx.font = '400 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Bonus Earned', cardMargin + 20, 255);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0fb47a';
    ctx.font = '400 14px sans-serif';
    ctx.fillText(`+₦5.00 Cashback`, 390 - cardMargin - 20, 255);

    // Transaction Details Header
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = '700 20px sans-serif';
    ctx.fillText('Transaction Details', cardMargin + 20, 335);

    const detailX = cardMargin + 20;
    const valueX = 390 - cardMargin - 20;
    let currentY = 375;
    const spacing = 42;

    const drawDetailRow = (label: string, value: string, hasCopyIcon: boolean = false, isChevron: boolean = false) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8e94a3';
      ctx.font = '400 15px sans-serif';
      ctx.fillText(label, detailX, currentY);
      
      ctx.textAlign = 'right';
      ctx.fillStyle = '#111827';
      ctx.font = '400 15px sans-serif';
      
      let finalValueX = valueX;
      if (hasCopyIcon || isChevron) finalValueX -= 24;
      
      // Keep readability high but ensure no clashing
      if (label === 'Transaction No.' || label === 'Transaction Date') {
        ctx.font = '400 12.5px sans-serif';
      }
      
      ctx.fillText(value, finalValueX, currentY);
      
      if (hasCopyIcon) {
        ctx.strokeStyle = '#b1b6c1';
        ctx.lineWidth = 1.1;
        const iconSize = 12;
        ctx.strokeRect(valueX - 14, currentY - 13, iconSize, iconSize);
        ctx.strokeRect(valueX - 17, currentY - 10, iconSize, iconSize);
      }
      
      if (isChevron) {
        ctx.strokeStyle = '#b1b6c1';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(valueX - 9, currentY - 9);
        ctx.lineTo(valueX - 5, currentY - 4);
        ctx.lineTo(valueX - 9, currentY + 1);
        ctx.stroke();
      }
      currentY += spacing;
    };

    drawDetailRow('Recipient Mobile', data.phoneNumber);
    drawDetailRow('Transaction Type', 'Airtime');
    drawDetailRow('Payment Method', 'OWealth', false, true);
    
    const refPrefix = data.network === "MTN" ? "251227" : data.network === "Glo" ? "251228" : "251231";
    const randomRefNum = refPrefix + Math.floor(Math.random() * 1000000000000000).toString().padStart(16, '0');
    drawDetailRow('Transaction No.', randomRefNum, true);

    const dateObj = new Date(data.date);
    const dayVal = dateObj.getDate();
    const monthNamesArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const getSuffix = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
      }
    };
    const finalFormattedDate = `${monthNamesArr[dateObj.getMonth()]} ${dayVal}${getSuffix(dayVal)}, ${dateObj.getFullYear()} ${data.time}:56`;
    drawDetailRow('Transaction Date', finalFormattedDate);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${mode}-receipt-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Receipt downloaded",
          description: "Your receipt has been saved.",
        });
      }
    });
  };

  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Select Application</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#E60000]"
            onClick={() => setMode("uba")}
            data-testid="card-select-uba"
          >
            <CardContent className="flex flex-col items-center p-8">
              <div className="w-16 h-16 bg-[#E60000] rounded-full flex items-center justify-center mb-4">
                <Send className="text-white w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">UBA</h2>
              <p className="text-gray-500 text-center mt-2">Transfer Receipt Demo</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#10B981]"
            onClick={() => setMode("opay")}
            data-testid="card-select-opay"
          >
            <CardContent className="flex flex-col items-center p-8">
              <div className="w-16 h-16 bg-[#10B981] rounded-full flex items-center justify-center mb-4">
                <Smartphone className="text-white w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">OPay</h2>
              <p className="text-gray-500 text-center mt-2">Airtime Receipt Demo</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-4 font-sans">
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => {
            setMode("landing");
            setReceiptData(null);
          }}
          className="flex items-center text-gray-600"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Selection
        </Button>
      </div>

      <Card className="w-full max-w-md bg-white shadow-sm border border-gray-100">
        <CardContent className="pt-6 px-6 pb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {mode === "uba" ? "UBA Transfer" : "OPay Airtime"}
          </h1>
          
          {mode === "uba" ? (
            <Form {...transferForm}>
              <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-6">
                <FormField
                  control={transferForm.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Oluwadamilola Deborah Idogbe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transferForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (NGN)</FormLabel>
                      <FormControl>
                        <Input placeholder="20000" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transferForm.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Bank name</FormLabel>
                      <Popover open={openBankSelector} onOpenChange={setOpenBankSelector}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("justify-between font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value || "Select a bank"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search bank..." />
                            <CommandList>
                              <CommandEmpty>No bank found.</CommandEmpty>
                              <CommandGroup>
                                {nigerianBanks.map((bank) => (
                                  <CommandItem
                                    key={bank.code}
                                    value={bank.name}
                                    onSelect={() => {
                                      transferForm.setValue("bankName", bank.name);
                                      setOpenBankSelector(false);
                                    }}
                                  >
                                    {bank.name}
                                    <Check className={cn("ml-auto h-4 w-4", field.value === bank.name ? "opacity-100" : "opacity-0")} />
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
                  control={transferForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account number</FormLabel>
                      <FormControl>
                        <Input placeholder="7056172558" maxLength={20} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-lg bg-[#E60000] hover:bg-[#cc0000] text-white">
                  Generate Receipt
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...airtimeForm}>
              <form onSubmit={airtimeForm.handleSubmit(onAirtimeSubmit)} className="space-y-6">
                <FormField
                  control={airtimeForm.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-2">
                          {["MTN", "Glo", "Airtel"].map((net) => (
                            <Button
                              key={net}
                              type="button"
                              variant={field.value === net ? "default" : "outline"}
                              className={cn(
                                "w-full",
                                field.value === net && net === "MTN" && "bg-[#FFCC00] hover:bg-[#e6b800] text-black",
                                field.value === net && net === "Glo" && "bg-[#008000] hover:bg-[#006400] text-white",
                                field.value === net && net === "Airtel" && "bg-[#FF0000] hover:bg-[#cc0000] text-white"
                              )}
                              onClick={() => airtimeForm.setValue("network", net as any)}
                            >
                              {net}
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={airtimeForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="08030639305" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={airtimeForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (NGN)</FormLabel>
                      <FormControl>
                        <Input placeholder="500" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={airtimeForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={airtimeForm.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg bg-[#10B981] hover:bg-[#059669] text-white">
                  Generate Airtime Receipt
                </Button>
              </form>
            </Form>
          )}
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
              className={cn(
                "w-full h-12 text-lg text-white",
                mode === "uba" ? "bg-[#E60000] hover:bg-[#cc0000]" : "bg-[#10B981] hover:bg-[#059669]"
              )}
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
