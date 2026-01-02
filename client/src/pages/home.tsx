import JSZip from "jszip";
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
import mtnLogo from "@/assets/logos/mtn.png";
import gloLogo from "@/assets/logos/glo.png";
import airtelLogo from "@/assets/logos/airtel.png";
import { cn } from "@/lib/utils";
import avatarImage from "@/assets/logos/avatar.png";
import { useToast } from "@/hooks/use-toast";
import { nigerianBanks } from "@/data/nigerian-banks";

import { Label } from "@/components/ui/label";

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
    .length(10, "Account number must be exactly 10 digits"),
});

const airtimeSchema = z.object({
  network: z.enum(["MTN", "Glo", "Airtel"]),
  phoneNumber: z.string()
    .regex(/^\d+$/, "Phone number must be digits only")
    .length(11, "Phone number must be exactly 11 digits"),
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
  const [subMode, setSubMode] = useState<"manual" | "auto">("manual");
  const [autoBatchCount, setAutoBatchCount] = useState(10);
  const [autoAmountMode, setAutoAmountMode] = useState<"fixed" | "random">("fixed");
  const [autoFixedAmount, setAutoFixedAmount] = useState("20000");
  const [autoMinAmount, setAutoMinAmount] = useState("5000");
  const [autoMaxAmount, setAutoMaxAmount] = useState("50000");
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [batchResults, setBatchResults] = useState<{name: string, blob: Blob}[]>([]);
  const [batchZip, setBatchZip] = useState<Blob | null>(null);
  const [receiptData, setReceiptData] = useState<TransferFormValues | AirtimeFormValues | null>(null);
  const [openBankSelector, setOpenBankSelector] = useState(false);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopBatch = () => {
    abortRef.current = true;
    toast({
      title: "Stopping...",
      description: "Batch generation aborted.",
    });
  };

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
    const generate = async () => {
      if (receiptData && (canvasRef.current || subMode === "auto")) {
        if (mode === "uba") {
          await generateUBAReceiptCanvas();
        } else if (mode === "opay") {
          await generateOPayReceiptCanvas();
        }
      }
    };
    generate();
  }, [receiptData, mode]);

  const generateUBAReceiptCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !receiptData || mode !== "uba") return;
    const data = receiptData as TransferFormValues;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas before drawing
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

    return new Promise<void>((resolve) => {
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

        const amountValue = parseFloat(data.amount).toLocaleString('en-NG', { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 2 
        });

        ctx.fillText('You have successfully', textX, textY);
        textY += lineHeight;
        ctx.fillText(`transferred NGN${amountValue} to`, textX, textY);
        textY += lineHeight;
        ctx.fillText(data.recipientName.toUpperCase(), textX, textY);
        textY += lineHeight + 2;
        ctx.fillText(`Bank Name: ${data.bankName}`, textX, textY);
        textY += lineHeight;
        ctx.fillText(`Account Number: ${data.accountNumber}`, textX, textY);
        resolve();
      };
      img.src = avatarImage;
    });
  };

  const generateOPayReceiptCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !receiptData || mode !== "opay") return;
    const data = receiptData as AirtimeFormValues;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
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
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.02)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 1;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(cardMargin, 55, cardWidth, 230, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cardMargin, 300, cardWidth, 285, 12);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const centerX = 390 / 2;

    ctx.beginPath();
    ctx.arc(centerX, 55, 26, 0, Math.PI * 2);
    if (data.network === "MTN") ctx.fillStyle = "#ffcc00";
    else if (data.network === "Glo") ctx.fillStyle = "#4caf50";
    else ctx.fillStyle = "#e60000";
    ctx.fill();

    const drawNetworkLogo = () => {
      return new Promise<void>((resolve) => {
        const logoSize = 52; // Reverted to original size
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
            ctx.beginPath();
            ctx.arc(centerX, 55, 26, 0, Math.PI * 2); // Reverted arc radius to 26
            ctx.clip();
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            ctx.restore();
            resolve();
          };
          logoImg.src = logoSrc;
          if (logoImg.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, 55, 26, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            ctx.restore();
            resolve();
          }
        } else {
          resolve();
        }
      });
    };

    await drawNetworkLogo();

    ctx.fillStyle = '#111827';
    ctx.font = '508 18px sans-serif'; // Reduced weight from 535 to 508 (~5% reduction)
    ctx.textAlign = 'center';
    ctx.letterSpacing = '0.3px';
    const networkNameY = 120;
    ctx.fillText(data.network, centerX, networkNameY);

    const amountValue = parseFloat(data.amount).toLocaleString('en-NG', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });

    // Successful text Y is 208
    const successfulTextY = 208;
    // Calculate middle between networkNameY and successfulTextY
    // networkNameY is at 120, successfulTextY is at 208
    // Middle is (120 + 208) / 2 = 164
    // Amount font size is 38px, so we need to account for baseline.
    const amountY = 172; 

    ctx.fillStyle = '#111827';
    ctx.font = '700 38px sans-serif'; // Reduced from 40px (~5% reduction)
    ctx.textAlign = 'center';
    ctx.fillText(`₦${amountValue}`, centerX, amountY);

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

    ctx.fillStyle = '#8e94a3';
    ctx.font = '400 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Bonus Earned', cardMargin + 20, 255);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0fb47a';
    ctx.font = '400 14px sans-serif';
    ctx.fillText(`+₦5.00 Cashback`, 390 - cardMargin - 20, 255);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = '700 20px sans-serif';
    ctx.fillText('Transaction Details', cardMargin + 20, 335);

    const detailX = cardMargin + 22;
    const valueX = 390 - cardMargin - 22;
    let currentY = 376;
    const spacing = 41;

    const drawDetailRow = (label: string, value: string, hasCopyIcon: boolean = false, isChevron: boolean = false) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8e94a3';
      ctx.font = '400 13px sans-serif';
      ctx.fillText(label, detailX, currentY);
      
      ctx.textAlign = 'right';
      ctx.fillStyle = '#111827';
      ctx.font = '500 14px sans-serif';
      
      let finalValueX = valueX;
      if (hasCopyIcon || isChevron) finalValueX -= 26;
      
      if (label === 'Transaction No.' || label === 'Transaction Date') {
        ctx.font = '500 12px sans-serif';
      }
      
      ctx.fillText(value, finalValueX, currentY);
      
      if (hasCopyIcon) {
        ctx.strokeStyle = '#b1b6c1';
        ctx.lineWidth = 1.0;
        const iconSize = 13;
        const iconX = valueX - 16;
        const iconY = currentY - 11;
        
        // Base rectangle
        ctx.strokeRect(iconX, iconY, iconSize - 3, iconSize - 3);
        
        // Overlap rectangle - moved closer (offset reduced from 3 to 2)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(iconX - 2, iconY + 2, iconSize - 3, iconSize - 3);
        ctx.strokeRect(iconX - 2, iconY + 2, iconSize - 3, iconSize - 3);
      }
      
      if (isChevron) {
        ctx.strokeStyle = '#b1b6c1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(valueX - 10, currentY - 8);
        ctx.lineTo(valueX - 5, currentY - 3);
        ctx.lineTo(valueX - 10, currentY + 2);
        ctx.stroke();
      }
      currentY += spacing;
    };

    const opayFinalFormattedPhone = data.phoneNumber.length === 11 
      ? `${data.phoneNumber.slice(0, 3)} ${data.phoneNumber.slice(3, 7)} ${data.phoneNumber.slice(7)}`
      : data.phoneNumber;

    drawDetailRow('Recipient Mobile', opayFinalFormattedPhone);
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

  const edoNames = [
    "Osaze", "Eghosa", "Ivie", "Amenaghawon", "Orobosa", "Etinosa", "Isoken", "Efe", "Osaigbovo", "Efosa",
    "Nosa", "Enoma", "Idemudia", "Osayande", "Itohan", "Oghogho", "Osasumwen", "Osamudiamen", "Iwinosa", "Eki",
    "Osagie", "Omoregie", "Imade", "Osarumen", "Eloghosa", "Osabuohien", "Osazuwa", "Enosakhare", "Oshodin", "Igbinedion",
    "Aigbe", "Omoruyi", "Osawaru", "Ojo", "Obasuyi", "Ugiagbe", "Okunzuwa", "Edebiri", "Akenzua", "Ighodaro",
    "Favour", "Godwin", "Joy", "Patience", "Samuel", "Gift", "Victor", "Blessing", "Faith", "Emanuel",
    "Chukwuma", "Ngozi", "Emeka", "Okon", "Segun", "Femi", "Tunde", "Ade", "Bala", "Musa"
  ];

  const edoSurnames = [
    "Igbinedion", "Ogbemudia", "Aigbe", "Omoruyi", "Osawaru", "Ojo", "Obasuyi", "Ugiagbe", "Okunzuwa", "Edebiri",
    "Akenzua", "Ighodaro", "Omoregie", "Osagie", "Aisien", "Imasuen", "Obaseki", "Oshodin", "Eghobamien", "Inneh",
    "Uwaifo", "Idahosa", "Eweka", "Agheyisi", "Agho", "Aiwerioghene", "Akpata", "Amadasun", "Arasomwan", "Asuen",
    "Eguavoen", "Ehanire", "Enobakhare", "Evbuomwan", "Iyekekpolor", "Iziedomwen", "Obanor", "Ogbeide", "Omorodion", "Oviasu"
  ];

  const generateRandomName = () => {
    const isEdo = Math.random() < 0.75;
    const hasMiddleName = Math.random() < 0.4; // 40% chance of middle name
    
    if (isEdo) {
      const first = edoNames[Math.floor(Math.random() * 40)];
      const last = edoSurnames[Math.floor(Math.random() * edoSurnames.length)];
      if (hasMiddleName) {
        const middle = edoNames[Math.floor(Math.random() * 40)];
        return `${first} ${middle} ${last}`;
      }
      return `${first} ${last}`;
    } else {
      const first = edoNames[40 + Math.floor(Math.random() * 20)];
      const last = ["Okonkwo", "Abubakar", "Olawale", "Adeyemi", "Chinedu"][Math.floor(Math.random() * 5)];
      if (hasMiddleName) {
        const middle = ["Chukwuma", "Ngozi", "Emeka", "Okon", "Segun"][Math.floor(Math.random() * 5)];
        return `${first} ${middle} ${last}`;
      }
      return `${first} ${last}`;
    }
  };

  const generateBatch = async () => {
    setIsGenerating(true);
    abortRef.current = false;
    setProgress(0);
    setBatchResults([]);
    setBatchZip(null);
    const zip = new JSZip();

    // Helper to preload an image
    const preloadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    // Preload all assets before starting
    try {
      await Promise.all([
        preloadImage(mtnLogo),
        preloadImage(gloLogo),
        preloadImage(airtelLogo),
        preloadImage(avatarImage)
      ]);
    } catch (err) {
      console.error("Failed to preload assets", err);
    }

    // Standard 10-digit NUBAN logic
    const generateNuban = (bank: { name: string, code: string }) => {
      // OPay and PalmPay use phone numbers as account numbers with the first 0 removed (10 digits)
      if (bank.name === "OPay" || bank.name === "PalmPay") {
        const prefixes = ["803", "806", "813", "703", "706", "810", "814", "903", "805", "815", "705", "905", "802", "808", "812"];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const rest = Math.floor(Math.random() * 9000000 + 1000000).toString();
        return (prefix + rest).slice(0, 10);
      }

      // Bank specific serial number patterns
      let serialPrefix = "";
      if (bank.name.includes("Zenith")) serialPrefix = ["10", "20", "60"][Math.floor(Math.random() * 3)];
      else if (bank.name.includes("Guaranty") || bank.name.includes("GTB")) serialPrefix = "0";
      else if (bank.name.includes("Access")) serialPrefix = ["00", "01", "10"][Math.floor(Math.random() * 3)];
      else if (bank.name.includes("First Bank")) serialPrefix = "30";
      else if (bank.name.includes("UBA") || bank.name.includes("United Bank")) serialPrefix = ["10", "20"][Math.floor(Math.random() * 2)];
      else serialPrefix = Math.floor(Math.random() * 9).toString();

      const remainingLength = 9 - serialPrefix.length;
      const serialBody = Math.floor(Math.random() * Math.pow(10, remainingLength)).toString().padStart(remainingLength, '0');
      const serial = serialPrefix + serialBody; // 9 digits total

      // NUBAN Check Digit Algorithm
      const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3];
      const bankCode = bank.code.padStart(3, '0').slice(-3);
      const combined = bankCode + serial; // 3 + 9 = 12 digits
      
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(combined[i]) * weights[i];
      }
      
      const checkDigit = (10 - (sum % 10)) % 10;
      return serial + checkDigit.toString();
    };

    // Realistic Phone Number Generator
    const generatePhone = (network: string) => {
      const prefixes: Record<string, string[]> = {
        "MTN": ["0803", "0806", "0813", "0816", "0810", "0814", "0903"],
        "Glo": ["0805", "0815", "0705", "0905", "0807", "0811"],
        "Airtel": ["0802", "0808", "0812", "0701", "0902", "0901", "0904"]
      };
      const networkPrefixes = prefixes[network] || ["0803"];
      const prefix = networkPrefixes[Math.floor(Math.random() * networkPrefixes.length)];
      const rest = Math.floor(Math.random() * 9000000 + 1000000).toString();
      return prefix + rest;
    };

    const batchData: (TransferFormValues | AirtimeFormValues)[] = [];

    for (let i = 0; i < autoBatchCount; i++) {
      const now = new Date();
      const randomTime = now.toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5);
      const randomDate = now.toISOString().split('T')[0];

      const randomAmount = autoAmountMode === "fixed" 
        ? autoFixedAmount 
        : (Math.floor(Math.random() * (parseInt(autoMaxAmount) - parseInt(autoMinAmount) + 1)) + parseInt(autoMinAmount)).toString();
      
      const randomBank = nigerianBanks[Math.floor(Math.random() * nigerianBanks.length)];
      const randomName = generateRandomName();
      const randomAcc = generateNuban(randomBank);
      
      const networks = ["MTN", "Glo", "Airtel"];
      const randomNetwork = networks[Math.floor(Math.random() * networks.length)] as "MTN" | "Glo" | "Airtel";
      const randomPhoneNum = generatePhone(randomNetwork);

      const item: TransferFormValues | AirtimeFormValues = mode === "uba" 
        ? {
            recipientName: randomName,
            amount: randomAmount,
            bankName: randomBank.name,
            accountNumber: randomAcc
          }
        : {
            network: randomNetwork,
            phoneNumber: randomPhoneNum,
            amount: randomAmount,
            date: randomDate,
            time: randomTime
          };
      
      batchData.push(item);
    }

    // Capture mode locally
    const currentBatchMode = mode;

    for (let i = 0; i < batchData.length; i++) {
      if (abortRef.current) break;

      // Force canvas reset
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Don't zero out dimensions to avoid flicker, just clear
        }
      }

      setReceiptData(batchData[i]);
      
      // Stabilization delay - reduced for better UX while maintaining reliability
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      if (currentBatchMode === "uba") {
        await generateUBAReceiptCanvas();
      } else {
        await generateOPayReceiptCanvas();
      }

      // Ensure rendering is complete
      await new Promise(resolve => requestAnimationFrame(() => 
        requestAnimationFrame(resolve)
      ));
      
      const updatedCanvas = canvasRef.current;
      if (updatedCanvas && updatedCanvas.width > 0) {
        const blob = await new Promise<Blob | null>(resolve => updatedCanvas.toBlob(resolve, 'image/png', 0.9));
        if (blob) {
          const item = batchData[i];
          const fileName = currentBatchMode === "uba" 
            ? `${currentBatchMode}_${(item as TransferFormValues).recipientName.replace(/\s/g, '_')}_${i + 1}.png`
            : `${currentBatchMode}_${(item as AirtimeFormValues).network}_${i + 1}.png`;
          zip.file(fileName, blob);
          setBatchResults(prev => [...prev, { name: fileName, blob }]);
        }
      }
      
      setProgress(i + 1);
    }

    if (Object.keys(zip.files).length > 0) {
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      setBatchZip(content);
    }
    
    setIsGenerating(false);
    if (abortRef.current) {
      toast({ title: "Batch Aborted", description: `Generation stopped at ${progress} receipts.` });
    } else {
      toast({ title: "Batch Completed", description: `Successfully generated and downloaded ${autoBatchCount} receipts.` });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use a more robust download method for iOS compatibility
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${mode}-receipt-${Date.now()}.png`;
    
    // Append to body for mobile Safari compatibility
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);

    toast({
      title: "Receipt downloaded",
      description: "Your receipt has been saved.",
    });
  };

  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Receipt Generators</h1>
        <p className="text-gray-500 mb-10 text-lg">Select a receipt type to get started</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-[#10B981] group"
            onClick={() => {
              setMode("opay");
              setSubMode("manual");
            }}
            data-testid="card-select-opay"
          >
            <CardContent className="flex flex-col items-center p-10">
              <div className="w-20 h-20 bg-[#10B981] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="text-white w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">OPay Receipts</h2>
              <p className="text-gray-500 text-center">Airtime & Transaction Receipts</p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="px-6" onClick={(e) => { e.stopPropagation(); setMode("opay"); setSubMode("manual"); }}>Manual</Button>
                <Button variant="default" className="bg-[#10B981] hover:bg-[#059669] px-6" onClick={(e) => { e.stopPropagation(); setMode("opay"); setSubMode("auto"); }}>Auto Gateway</Button>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-[#E60000] group"
            onClick={() => {
              setMode("uba");
              setSubMode("manual");
            }}
            data-testid="card-select-uba"
          >
            <CardContent className="flex flex-col items-center p-10">
              <div className="w-20 h-20 bg-[#E60000] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Send className="text-white w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">UBA Receipts</h2>
              <p className="text-gray-500 text-center">Transfer & Payment Receipts</p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="px-6" onClick={(e) => { e.stopPropagation(); setMode("uba"); setSubMode("manual"); }}>Manual</Button>
                <Button variant="default" className="bg-[#E60000] hover:bg-[#C40000] px-6" onClick={(e) => { e.stopPropagation(); setMode("uba"); setSubMode("auto"); }}>Auto Gateway</Button>
              </div>
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
            {mode === "uba" ? "UBA Transfer" : "OPay Airtime"} - {subMode === "manual" ? "Manual" : "Auto"}
          </h1>
          
          {subMode === "manual" ? (
            mode === "uba" ? (
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
                        <Input 
                          placeholder="20000" 
                          type="number" 
                          inputMode="decimal"
                          {...field} 
                        />
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
                              className={cn("w-full justify-between h-11 font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value || "Select a bank"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command className="w-full">
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
                                    <Check className={cn("mr-2 h-4 w-4", field.value === bank.name ? "opacity-100" : "opacity-0")} />
                                    {bank.name}
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
                        <Input 
                          placeholder="7056172558" 
                          type="tel"
                          inputMode="numeric"
                          maxLength={10} 
                          {...field} 
                        />
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
                        <Input 
                          placeholder="08030639305" 
                          type="tel" 
                          inputMode="numeric" 
                          maxLength={11} 
                          {...field} 
                        />
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
                        <Input 
                          placeholder="500" 
                          type="number" 
                          inputMode="decimal" 
                          {...field} 
                        />
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
          )
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Number of Receipts</Label>
                <Input 
                  type="number" 
                  value={autoBatchCount} 
                  onChange={(e) => setAutoBatchCount(parseInt(e.target.value) || 1)} 
                  min={1} 
                  max={100}
                />
              </div>

              <div>
                <Label>Amount Mode</Label>
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant={autoAmountMode === "fixed" ? "default" : "outline"}
                    onClick={() => setAutoAmountMode("fixed")}
                    className="flex-1"
                  >
                    Fixed
                  </Button>
                  <Button 
                    variant={autoAmountMode === "random" ? "default" : "outline"}
                    onClick={() => setAutoAmountMode("random")}
                    className="flex-1"
                  >
                    Random
                  </Button>
                </div>
              </div>

              {autoAmountMode === "fixed" ? (
                <div>
                  <Label>Fixed Amount (NGN)</Label>
                  <Input 
                    type="number" 
                    value={autoFixedAmount} 
                    onChange={(e) => setAutoFixedAmount(e.target.value)} 
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Amount</Label>
                    <Input 
                      type="number" 
                      value={autoMinAmount} 
                      onChange={(e) => setAutoMinAmount(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label>Max Amount</Label>
                    <Input 
                      type="number" 
                      value={autoMaxAmount} 
                      onChange={(e) => setAutoMaxAmount(e.target.value)} 
                    />
                  </div>
                </div>
              )}
            </div>

            {isGenerating ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300" 
                      style={{ width: `${(progress / autoBatchCount) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-500">
                    Generating {progress} / {autoBatchCount} receipts...
                  </p>
                </div>
                <Button 
                  onClick={stopBatch}
                  variant="destructive"
                  className="w-full h-12 text-lg"
                >
                  Stop & Abort
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button 
                  onClick={generateBatch}
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start Batch Generation
                </Button>
                
                {batchResults.length > 0 && (
                  <div className="mt-6 space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                      Generated Receipts
                      <span className="text-xs font-normal text-gray-500">{batchResults.length} items</span>
                    </h3>

                    {batchZip && (
                      <Button 
                        onClick={() => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const link = document.createElement("a");
                            link.href = reader.result as string;
                            link.download = `${mode}_batch_${new Date().toISOString().slice(0,10)}_${Date.now()}.zip`;
                            document.body.appendChild(link);
                            link.click();
                            setTimeout(() => {
                              document.body.removeChild(link);
                            }, 100);
                          };
                          reader.readAsDataURL(batchZip);
                        }}
                        className="w-full h-12 text-lg bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center gap-2 mb-4"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download All as ZIP
                      </Button>
                    )}

                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {batchResults.map((result, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 transition-colors">
                          <span className="text-xs text-gray-600 truncate mr-4 max-w-[180px]">{result.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const link = document.createElement('a');
                                link.href = reader.result as string;
                                link.download = result.name;
                                document.body.appendChild(link);
                                link.click();
                                setTimeout(() => {
                                  document.body.removeChild(link);
                                }, 100);
                              };
                              reader.readAsDataURL(result.blob);
                            }}
                          >
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={() => setSubMode("manual")}
              variant="outline"
              className="w-full"
              disabled={isGenerating}
            >
              Back to Manual
            </Button>
          </div>
        )}
      </CardContent>
      </Card>

      {/* Canvas Preview - Only show in manual mode */}
      {receiptData && subMode === "manual" && (
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

      {/* Hidden canvas for batch generation */}
      <canvas 
        ref={canvasRef} 
        className={cn("hidden", subMode === "manual" && "hidden")} 
        style={{ display: subMode === "manual" ? 'none' : 'none' }}
      />
    </div>
  );
}
