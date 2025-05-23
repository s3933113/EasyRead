
import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onDataUpload: (data: any) => void;
  onNext: () => void;
  currentStep: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataUpload, onNext }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileType, setFileType] = useState<'csv' | 'pdf' | null>(null);
  const { toast } = useToast();

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });

    return data;
  };

  const parsePDF = async (file: File) => {
    // For PDF files, we'll extract text content and structure it for analysis
    // In a real implementation, you'd use a library like PDF.js
    // For now, we'll create a mock structure
    const fileName = file.name;
    const fileSize = file.size;
    
    // Mock PDF data structure
    const mockData = [
      {
        fileName: fileName,
        fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
        type: 'PDF Document',
        content: 'PDF content will be extracted for analysis',
        pages: 'Multiple pages',
        uploadDate: new Date().toISOString()
      }
    ];

    return mockData;
  };

  const handleFile = useCallback(async (file: File) => {
    const isCSV = file.name.endsWith('.csv');
    const isPDF = file.name.endsWith('.pdf');

    if (!isCSV && !isPDF) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or PDF file.",
        variant: "destructive",
      });
      return;
    }

    try {
      let data: any[] = [];

      if (isCSV) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            data = parseCSV(text);
            
            if (data.length === 0) {
              toast({
                title: "Empty file",
                description: "The uploaded file appears to be empty.",
                variant: "destructive",
              });
              return;
            }

            setUploadedFile(file);
            setParsedData(data);
            setFileType('csv');
            onDataUpload(data);
            
            toast({
              title: "CSV file uploaded successfully!",
              description: `Parsed ${data.length} rows of data.`,
            });
          } catch (error) {
            toast({
              title: "Error parsing file",
              description: "There was an error reading your CSV file.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      } else if (isPDF) {
        data = await parsePDF(file);
        
        setUploadedFile(file);
        setParsedData(data);
        setFileType('pdf');
        onDataUpload(data);
        
        toast({
          title: "PDF file uploaded successfully!",
          description: "PDF content will be analyzed for insights.",
        });
      }
    } catch (error) {
      toast({
        title: "Error processing file",
        description: "There was an error processing your file.",
        variant: "destructive",
      });
    }
  }, [onDataUpload, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Upload Your Data</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Upload a CSV or PDF file to get started with AI-powered analysis and quiz generation
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : uploadedFile
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv,.pdf"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          {uploadedFile ? (
            <div className="flex items-center justify-center space-x-3">
              {fileType === 'csv' ? (
                <FileText className="w-12 h-12 text-green-600" />
              ) : (
                <FileIcon className="w-12 h-12 text-green-600" />
              )}
              <div className="text-left">
                <p className="font-semibold text-green-700 dark:text-green-400">{uploadedFile.name}</p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  {fileType === 'csv' ? `${parsedData.length} rows parsed` : 'PDF ready for analysis'}
                </p>
              </div>
            </div>
          ) : (
            <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" />
          )}
          
          <div>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {uploadedFile ? 'File uploaded successfully!' : 'Drop your CSV or PDF file here'}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {uploadedFile ? 'Ready to analyze your data' : 'or click to browse files'}
            </p>
          </div>
        </div>
      </div>

      {uploadedFile && parsedData.length > 0 && (
        <div className="mt-8">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Data Preview</h3>
            {fileType === 'csv' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-600">
                      {Object.keys(parsedData[0]).slice(0, 5).map((header) => (
                        <th key={header} className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-200">
                          {header}
                        </th>
                      ))}
                      {Object.keys(parsedData[0]).length > 5 && (
                        <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-200">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 3).map((row, index) => (
                      <tr key={index} className="border-b dark:border-gray-600">
                        {Object.values(row).slice(0, 5).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="py-2 px-4 text-gray-600 dark:text-gray-300">
                            {String(value).length > 30 ? String(value).substring(0, 30) + '...' : String(value)}
                          </td>
                        ))}
                        {Object.values(row).length > 5 && (
                          <td className="py-2 px-4 text-gray-400 dark:text-gray-500">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 3 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Showing 3 of {parsedData.length} rows
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {parsedData.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600">
                    <span className="font-medium dark:text-white">{Object.keys(item)[0]}:</span>
                    <span className="text-gray-600 dark:text-gray-300">{Object.values(item)[0] as string}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={onNext} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Continue to AI Summary
            </Button>
          </div>
        </div>
      )}

      {!uploadedFile && (
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Supported Formats</p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                CSV files with headers in the first row, or PDF documents for content analysis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
