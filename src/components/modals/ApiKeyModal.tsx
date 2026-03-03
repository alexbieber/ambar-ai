import { useState, useRef, useEffect } from 'react';
import { useAiStore, type AIProvider } from '../../stores/aiStore';
import { useUiStore } from '../../stores/uiStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { streamCompletion } from '../../services/claudeService';
import { streamCompletion as geminiStreamCompletion } from '../../services/geminiService';
import { CLAUDE_MODELS, GEMINI_MODELS } from '../../utils/constants';
import { clsx } from 'clsx';

export function ApiKeyModal() {
  const provider = useAiStore((s) => s.provider);
  const anthropicApiKey = useAiStore((s) => s.anthropicApiKey);
  const geminiApiKey = useAiStore((s) => s.geminiApiKey);
  const setProvider = useAiStore((s) => s.setProvider);
  const setAnthropicKey = useAiStore((s) => s.setAnthropicKey);
  const setGeminiKey = useAiStore((s) => s.setGeminiKey);
  const setShowApiKeyModal = useUiStore((s) => s.setShowApiKeyModal);
  const showNotification = useUiStore((s) => s.showNotification);

  const [activeTab, setActiveTab] = useState<Exclude<AIProvider, 'auto'>>(
    provider === 'auto' ? 'gemini' : provider
  );
  const [key, setKey] = useState(provider === 'anthropic' ? anthropicApiKey : geminiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setKey(activeTab === 'anthropic' ? anthropicApiKey : geminiApiKey);
  }, [activeTab, anthropicApiKey, geminiApiKey]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeTab]);

  const validateAnthropic = () => /^sk-ant-/.test(key.trim());
  const validateGemini = () => /^AIza/.test(key.trim()) && key.trim().length >= 20;

  const handleConnect = () => {
    setError('');
    if (!key.trim()) {
      setError('Please enter your API key.');
      return;
    }
    if (activeTab === 'anthropic') {
      if (!validateAnthropic()) {
        setError('Anthropic key must start with sk-ant-');
        return;
      }
      setAnthropicKey(key.trim());
      setProvider('anthropic');
    } else {
      if (!validateGemini()) {
        setError('Enter a valid Google AI (Gemini) API key.');
        return;
      }
      setGeminiKey(key.trim());
      setProvider('gemini');
    }
    setShowApiKeyModal(false);
    showNotification('API key saved.', 'success');
  };

  const handleTest = async () => {
    if (activeTab === 'anthropic') {
      if (!key.trim() || !validateAnthropic()) return;
      setTesting(true);
      setTestResult(null);
      try {
        await streamCompletion({
          apiKey: key.trim(),
          system: 'You are a test. Reply with OK.',
          messages: [{ role: 'user', content: 'Hi' }],
          maxTokens: 10,
        });
        setTestResult('success');
      } catch {
        setTestResult('fail');
      } finally {
        setTesting(false);
      }
    } else {
      if (!key.trim() || !validateGemini()) return;
      setTesting(true);
      setTestResult(null);
      try {
        await geminiStreamCompletion({
          apiKey: key.trim(),
          system: 'You are a test. Reply with OK.',
          messages: [{ role: 'user', content: 'Hi' }],
          maxTokens: 10,
        });
        setTestResult('success');
      } catch {
        setTestResult('fail');
      } finally {
        setTesting(false);
      }
    }
  };

  const claudeModelId = useAiStore((s) => s.claudeModelId);
  const geminiModelId = useAiStore((s) => s.geminiModelId);
  const modelName =
    activeTab === 'anthropic'
      ? CLAUDE_MODELS.find((m) => m.id === claudeModelId)?.label ?? claudeModelId
      : GEMINI_MODELS.find((m) => m.id === geminiModelId)?.label ?? geminiModelId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={() => setShowApiKeyModal(false)}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-7 shadow-2xl animate-[fadeUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-3xl mb-2">🔑</div>
            <h2 className="font-display font-extrabold text-xl text-white">Connect Your API Key</h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Your key is stored locally and never sent to our servers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowApiKeyModal(false)}
            className="p-2 rounded text-[var(--muted)] hover:bg-[var(--faint)] hover:text-[var(--text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-4 rounded-lg bg-[var(--faint)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('anthropic')}
            className={clsx(
              'flex-1 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'anthropic'
                ? 'bg-[var(--panel)] text-accent shadow'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            )}
          >
            Anthropic (Claude)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gemini')}
            className={clsx(
              'flex-1 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'gemini'
                ? 'bg-[var(--panel)] text-accent shadow'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            )}
          >
            Google (Gemini)
          </button>
        </div>

        <label className="block text-[9px] uppercase tracking-wider text-accent mb-2">
          {activeTab === 'anthropic' ? 'Anthropic API Key' : 'Google Gemini API Key'}
        </label>
        <div className="relative">
          <Input
            ref={inputRef}
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConnect();
              }
            }}
            placeholder={
              activeTab === 'anthropic' ? 'sk-ant-api03-…' : 'AIza…'
            }
            error={Boolean(error)}
            className="pr-10"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--text)]"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        <p className="text-xs text-[var(--muted)] mt-2">
          {activeTab === 'anthropic' ? (
            <>
              Get a key at{' '}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                console.anthropic.com
              </a>
            </>
          ) : (
            <>
              Get a key at{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                aistudio.google.com/apikey
              </a>
            </>
          )}
        </p>

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1 bg-gradient-to-r from-accent to-violet text-[var(--bg)] font-semibold"
            onClick={handleConnect}
          >
            Connect →
          </Button>
          <Button variant="secondary" onClick={handleTest} disabled={testing || !key.trim()}>
            {testing ? 'Testing…' : 'Test'}
          </Button>
        </div>

        {testResult === 'success' && (
          <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            ✓ Key is valid — {modelName} ready
          </p>
        )}
        {testResult === 'fail' && (
          <p className="mt-2 text-xs text-red-400">✗ Invalid key or quota exceeded</p>
        )}

        <div className="mt-6 p-3 rounded-lg bg-[var(--faint)] border border-[var(--border)] flex gap-2 text-xs text-[var(--muted)]">
          <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Your API key is stored only in your browser&apos;s localStorage. It is sent directly to
            the provider&apos;s API. We never see it.
          </p>
        </div>
      </div>
    </div>
  );
}
