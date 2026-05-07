
import React, { useState } from 'react';
import { Upload, FileText, Database, Activity, PlayCircle } from 'lucide-react';

interface FileUploadProps {
  onUpload: (matchInfo: string, tracking: string, events: string) => void;
  onDemoLoad: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, onDemoLoad }) => {
  const [matchInfoFile, setMatchInfoFile] = useState<File | null>(null);
  const [trackingFile, setTrackingFile] = useState<File | null>(null);
  const [eventsFile, setEventsFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const processFiles = async () => {
    if (!matchInfoFile || !trackingFile || !eventsFile) return;

    setIsLoading(true);

    const readFile = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    };

    try {
      const [infoText, trackText, eventText] = await Promise.all([
        readFile(matchInfoFile),
        readFile(trackingFile),
        readFile(eventsFile)
      ]);
      
      // Artificial delay to allow UI to update before heavy processing freezes it briefly
      setTimeout(() => {
        onUpload(infoText, trackText, eventText);
      }, 100);
      
    } catch (error) {
      console.error("Error reading files", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Load Match Data</h1>
          <p className="text-gray-400">Upload your XML files to generate the match visualization.</p>
        </div>

        <div className="space-y-6">
          {/* Match Info Input */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              Match Information (DFL)
            </label>
            <input
              type="file"
              accept=".xml"
              onChange={(e) => handleFileChange(e, setMatchInfoFile)}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                cursor-pointer bg-gray-900/50 rounded-lg border border-gray-600 p-2
              "
            />
          </div>

          {/* Tracking Input */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Activity size={16} className="text-green-400" />
              Tracking Data (DFL Positions)
            </label>
            <input
              type="file"
              accept=".xml"
              onChange={(e) => handleFileChange(e, setTrackingFile)}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-green-600 file:text-white
                hover:file:bg-green-700
                cursor-pointer bg-gray-900/50 rounded-lg border border-gray-600 p-2
              "
            />
          </div>

          {/* Events Input */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-purple-400" />
              Event Data (Opta F24)
            </label>
            <input
              type="file"
              accept=".xml"
              onChange={(e) => handleFileChange(e, setEventsFile)}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-600 file:text-white
                hover:file:bg-purple-700
                cursor-pointer bg-gray-900/50 rounded-lg border border-gray-600 p-2
              "
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <button
            onClick={processFiles}
            disabled={!matchInfoFile || !trackingFile || !eventsFile || isLoading}
            className={`
              w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
              ${!matchInfoFile || !trackingFile || !eventsFile 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/30'}
            `}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Data...
              </>
            ) : (
              <>
                <Upload size={20} />
                Visualize Match
              </>
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase tracking-widest">Or try demo</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <button
            onClick={onDemoLoad}
            className="w-full py-3 rounded-xl font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 border border-gray-600"
          >
            <PlayCircle size={18} />
            Load Sample Match (Demo)
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
