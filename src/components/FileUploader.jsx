import React, { useState } from 'react';
import { Database, Upload, FileText, X, AlertCircle, Sparkles, Heart, ExternalLink, Shield, AlertTriangle, Sun, Moon } from 'lucide-react';
import parseXMLFiles from '../ddr-parser';

const FileUploader = ({ onDataLoaded, darkMode, toggleDarkMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    setError(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const parseFiles = async () => {
    if (files.length === 0) {
      setError('Please select at least one XML file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedData = await parseXMLFiles(files);
      onDataLoaded(parsedData);
    } catch (err) {
      setError(`Parse error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 overflow-auto transition-colors ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center relative">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`absolute right-0 top-0 p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/25">
            <Database size={32} className="text-white" />
          </div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>FileMaker DDR Explorer</h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Analyze your Database Design Reports</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Card */}
          <div className={`rounded-2xl shadow-xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Upload size={20} className="text-blue-500" />
              Upload DDR Files
            </h2>

            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all group ${darkMode ? 'border-gray-600 hover:border-blue-500 hover:bg-blue-900/20' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
              <Upload size={32} className={`mx-auto mb-2 group-hover:text-blue-500 transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <label className="cursor-pointer">
                <span className="text-blue-500 hover:text-blue-600 font-medium transition-colors">Choose XML files</span>
                <input
                  type="file"
                  multiple
                  accept=".xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>or drag and drop</p>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2 max-h-40 overflow-auto">
                {files.map((file, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <FileText size={16} className={darkMode ? 'text-gray-400' : 'text-gray-400'} />
                    <span className={`flex-1 text-sm truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{file.name}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              onClick={parseFiles}
              disabled={loading || files.length === 0}
              className={`mt-4 w-full py-3 rounded-xl font-medium transition-all ${
                loading || files.length === 0
                  ? darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={18} className="animate-spin" />
                  Parsing...
                </span>
              ) : 'Analyze DDR Files'}
            </button>
          </div>

          {/* About Card */}
          <div className={`rounded-2xl shadow-xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Heart size={20} className="text-pink-500" />
              About This Tool
            </h2>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              DDR Explorer is a <strong>non-commercial tool</strong> built just for fun by FileMaker developers
              who wanted a better way to explore and analyze Database Design Reports. It's offered freely to the
              FileMaker community with no strings attached.
            </p>
            <div className={`mt-4 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Prefer to run it locally?</strong> Download the source code and run it yourself:
              </p>
              <a
                href="https://github.com/rulosa01/ddranalyzer"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                <ExternalLink size={14} />
                github.com/rulosa01/ddranalyzer
              </a>
            </div>
          </div>
        </div>

        {/* Privacy & Disclaimer Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Privacy Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Shield size={20} className="text-emerald-500" />
              Privacy & Data Storage
            </h2>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-4">
              <p className="text-emerald-800 dark:text-emerald-400 font-medium text-sm">Your data never leaves your browser.</p>
            </div>
            <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>All DDR XML files are processed <strong>entirely in your browser</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>No data is uploaded to any server — there is no server</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>No cookies, no tracking, no analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>When you close or refresh the page, all parsed data is gone</span>
              </li>
            </ul>
          </div>

          {/* Disclaimer Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Disclaimer
            </h2>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-400">
              <p className="mb-2">
                <strong>This tool is provided "as-is" without warranty of any kind.</strong>
              </p>
              <p>
                The authors make no guarantees about the accuracy, completeness, or reliability of the analysis
                provided. Use at your own risk. This is not affiliated with or endorsed by Claris International Inc.
                or FileMaker, Inc.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          Made with ❤️ for the FileMaker community
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
