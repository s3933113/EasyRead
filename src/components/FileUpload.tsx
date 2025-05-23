
import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
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

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        
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
        onDataUpload(data);
        
        toast({
          title: "File uploaded successfully!",
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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Data</h2>
        <p className="text-lg text-gray-600">
          Upload a CSV file to get started with AI-powered analysis and quiz generation
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : uploadedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          {uploadedFile ? (
            <div className="flex items-center justify-center space-x-3">
              <FileText className="w-12 h-12 text-green-600" />
              <div className="text-left">
                <p className="font-semibold text-green-700">{uploadedFile.name}</p>
                <p className="text-sm text-green-600">{parsedData.length} rows parsed</p>
              </div>
            </div>
          ) : (
            <Upload className="w-16 h-16 text-gray-400 mx-auto" />
          )}
          
          <div>
            <p className="text-xl font-semibold text-gray-700 mb-2">
              {uploadedFile ? 'File uploaded successfully!' : 'Drop your CSV file here'}
            </p>
            <p className="text-gray-500">
              {uploadedFile ? 'Ready to analyze your data' : 'or click to browse files'}
            </p>
          </div>
        </div>
      </div>

      {uploadedFile && parsedData.length > 0 && (
        <div className="mt-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Data Preview</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    {Object.keys(parsedData[0]).slice(0, 5).map((header) => (
                      <th key={header} className="text-left py-2 px-4 font-medium text-gray-700">
                        {header}
                      </th>
                    ))}
                    {Object.keys(parsedData[0]).length > 5 && (
                      <th className="text-left py-2 px-4 font-medium text-gray-700">...</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 3).map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row).slice(0, 5).map((value: any, cellIndex) => (
                        <td key={cellIndex} className="py-2 px-4 text-gray-600">
                          {String(value).length > 30 ? String(value).substring(0, 30) + '...' : String(value)}
                        </td>
                      ))}
                      {Object.values(row).length > 5 && (
                        <td className="py-2 px-4 text-gray-400">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 3 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing 3 of {parsedData.length} rows
              </p>
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
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Supported Format</p>
              <p className="text-sm text-blue-600">
                Currently supports CSV files. Make sure your data has headers in the first row.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
