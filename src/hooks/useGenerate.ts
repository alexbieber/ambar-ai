import { useCallback } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useAiStore } from '../stores/aiStore';
import { useUiStore } from '../stores/uiStore';
import * as claude from '../services/claudeService';
import * as gemini from '../services/geminiService';
import { APIError } from '../services/claudeService';
import { inferLanguage } from '../services/fileParser';
import type { Project, ProjectFile, GenerationStep, ProviderId } from '../types';

const STEPS: GenerationStep[] = [
  { id: '1', label: 'Initializing project architecture', status: 'pending' },
  { id: '2', label: 'Generating Flutter source files', status: 'pending' },
  { id: '3', label: 'Parsing project structure', status: 'pending' },
  { id: '4', label: 'Rendering live preview', status: 'pending' },
  { id: '5', label: 'Finalizing', status: 'pending' },
];

function createProjectFile(path: string, content: string): ProjectFile {
  return {
    path,
    content,
    language: inferLanguage(path),
    isDirty: false,
    lastModified: Date.now(),
    lockedByAgentId: null,
    lastEditedByAgentId: null,
    lastEditedByProvider: null,
  };
}

export function useGenerate() {
  const setProject = useProjectStore((s) => s.setProject);
  const addToHistory = useProjectStore((s) => s.addToHistory);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);
  const project = useProjectStore((s) => s.project);

  const apiKey = useAiStore((s) => s.apiKey);
  const provider = useAiStore((s) => s.provider);
  const setLoading = useAiStore((s) => s.setLoading);
  const setStep = useAiStore((s) => s.setStep);
  const setSteps = useAiStore((s) => s.setSteps);
  const updateStepStatus = useAiStore((s) => s.updateStepStatus);
  const setLastError = useAiStore((s) => s.setLastError);
  const clearError = useAiStore((s) => s.clearError);
  const appendStreamingChunk = useAiStore((s) => s.appendStreamingChunk);
  const addGeneratedFilePath = useAiStore((s) => s.addGeneratedFilePath);
  const clearGenerationLive = useAiStore((s) => s.clearGenerationLive);

  const showNotification = useUiStore((s) => s.showNotification);
  const anthropicApiKey = useAiStore((s) => s.anthropicApiKey);

  const generate = useCallback(
    async (prompt: string, forceProvider?: 'anthropic' | 'gemini') => {
      const state = useAiStore.getState();
      const effectiveProvider = forceProvider ?? state.getEffectiveProvider();
      const effectiveKey = forceProvider === 'anthropic' ? anthropicApiKey : forceProvider === 'gemini' ? state.geminiApiKey : state.getEffectiveApiKey();
      const modelId = state.getEffectiveModelId(effectiveProvider);

      if (!effectiveKey?.trim() || !prompt.trim()) {
        showNotification('Enter an API key and a project description.', 'error');
        return;
      }
      clearError();
      clearGenerationLive();
      setLoading(true);
      setSteps(STEPS.map((s) => ({ ...s, status: 'pending' as const })));

      try {
        updateStepStatus('1', 'running', 'Starting…');
        setStep(forceProvider === 'anthropic' ? 'Using Claude (Gemini rate limited)…' : 'Validating prompt & API…', 2);

        const providerName = effectiveProvider === 'anthropic' ? 'Claude' : 'Gemini';
        setStep(`Connecting to ${providerName}…`, 5);
        updateStepStatus('1', 'done');
        updateStepStatus('2', 'running', 'Waiting for API…');
        setStep(`Sending prompt to ${providerName}…`, 8);

        const ai = effectiveProvider === 'anthropic' ? claude : gemini;
        const filesRecord = await ai.generateProject({
          apiKey: effectiveKey.trim(),
          prompt,
          model: modelId,
          onStreamChunk: appendStreamingChunk,
          onProgress: (step, pct) => {
            setStep(step, Math.min(60, 10 + pct * 0.5));
            updateStepStatus('2', 'running', step);
          },
          onRetryWait: (msg) => {
            setStep(msg, 15);
            updateStepStatus('2', 'running', msg);
          },
          skipRetryWait: effectiveProvider === 'gemini' && !!anthropicApiKey?.trim(),
        });

        updateStepStatus('2', 'done', `${Object.keys(filesRecord).length} files received`);
        updateStepStatus('3', 'running', 'Building file list…');
        setStep('Parsing project structure…', 62);

        const files: Record<string, ProjectFile> = {};
        const entries = Object.entries(filesRecord);
        entries.forEach(([path, content], i) => {
          files[path] = createProjectFile(path, content);
          addGeneratedFilePath(path);
          const num = i + 1;
          const total = entries.length;
          setStep(`Creating file ${num}/${total}: ${path}`, 63 + (num / total) * 4);
          updateStepStatus('3', 'running', `${path} (${num}/${total})`);
        });

        updateStepStatus('3', 'done', `${entries.length} files created`);
        updateStepStatus('4', 'running', 'Calling API…');
        setStep('Rendering live preview…', 70);

        let previewHtml = '';
        try {
          previewHtml = await ai.generatePreview({
            apiKey: effectiveKey.trim(),
            prompt,
            model: modelId,
            onProgress: (step) => {
              setStep(step, 72);
              updateStepStatus('4', 'running', step);
            },
          });
        } catch (e) {
          setStep('Preview failed, using placeholder', 78);
          updateStepStatus('4', 'running', 'Preview failed, using placeholder');
          previewHtml = '<!DOCTYPE html><html><body style="background:#0e0e1c;color:#888;font-family:monospace;padding:16px;">Preview could not be generated.</body></html>';
        }

        updateStepStatus('4', 'done', 'Preview ready');
        updateStepStatus('5', 'running', 'Writing to project…');
        setStep('Finalizing project…', 92);

        const generatedByProvider: ProviderId = effectiveProvider === 'anthropic' ? 'claude' : 'gemini';
        const proj: Project = {
          id: `proj-${Date.now()}`,
          name: 'Flutter App',
          description: prompt,
          files,
          createdAt: Date.now(),
          previewHtml,
          generatedByProvider,
        };

        setProject(proj);
        addToHistory(proj);
        updateStepStatus('5', 'done');
        setStep('Done', 100);
        clearGenerationLive();
        showNotification(forceProvider === 'anthropic' ? 'Project generated with Claude (Gemini was rate limited).' : 'Project generated successfully.', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed';
        setLastError(msg);
        const isRateLimit = err instanceof APIError && err.code === 'rate_limit';
        const hasClaude = Boolean(anthropicApiKey?.trim());
        if (isRateLimit && effectiveProvider === 'gemini' && hasClaude && !forceProvider) {
          setStep('Switching to Claude…', 12);
          updateStepStatus('2', 'running', 'Gemini rate limited, using Claude');
          showNotification('Gemini rate limited. Retrying with Claude…', 'info');
          setLoading(false);
          await generate(prompt, 'anthropic');
          return;
        }
        if (isRateLimit && effectiveProvider === 'gemini' && hasClaude) {
          showNotification('Gemini rate limit. Wait ~1 min or switch to Claude (⌘K → Anthropic tab).', 'warning');
        } else if (isRateLimit && effectiveProvider === 'gemini') {
          showNotification('Gemini rate limit. Wait ~1 min then try again, or add a Claude key (⌘K) for another option.', 'warning');
        } else {
          showNotification(msg, 'error');
        }
        const ai = useAiStore.getState();
        setSteps(ai.steps.map((st) => ({ ...st, status: st.status === 'running' ? 'error' as const : st.status })));
      } finally {
        setLoading(false);
      }
    },
    [
      apiKey,
      provider,
      anthropicApiKey,
      setProject,
      addToHistory,
      setLoading,
      setSteps,
      setStep,
      updateStepStatus,
      setLastError,
      clearError,
      showNotification,
      appendStreamingChunk,
      addGeneratedFilePath,
      clearGenerationLive,
    ]
  );

  const editFile = useCallback(
    async (path: string, instruction: string) => {
      if (!apiKey || !project?.files[path]) return;
      const target = project.files[path];
      const context = Object.entries(project.files)
        .filter(([p]) => p !== path)
        .map(([p, f]) => `${p}:\n${f.content.split('\n').slice(0, 10).join('\n')}`)
        .join('\n\n');

      setLoading(true);
      clearError();
      const accumulated = { current: '' };
      const ai = provider === 'anthropic' ? claude : gemini;
      try {
        const newContent = await ai.editFile({
          apiKey,
          instruction,
          targetFile: target,
          projectContext: context,
          onChunk: (chunk) => {
            accumulated.current += chunk;
            updateFileContent(path, accumulated.current);
          },
        });
        updateFileContent(path, newContent);
        showNotification('File updated.', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Edit failed';
        setLastError(msg);
        showNotification(msg, 'error');
      } finally {
          setLoading(false);
      }
    },
    [apiKey, provider, anthropicApiKey, project, updateFileContent, setLoading, setLastError, clearError, showNotification]
  );

  const regeneratePreview = useCallback(async () => {
    const state = useAiStore.getState();
    const key = state.getEffectiveApiKey();
    const modelId = state.getEffectiveModelId(state.getEffectiveProvider());
    if (!key || !project) return;
    setLoading(true);
    const eff = state.getEffectiveProvider();
    const ai = eff === 'anthropic' ? claude : gemini;
    try {
      const html = await ai.generatePreview({ apiKey: key, prompt: project.description, model: modelId });
      setProject({ ...project, previewHtml: html });
      showNotification('Preview regenerated.', 'success');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Preview failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [project, setProject, setLoading, showNotification]);

  const enhance = useCallback(
    async (instruction: string) => {
      const state = useAiStore.getState();
      const key = state.getEffectiveApiKey();
      const eff = state.getEffectiveProvider();
      const modelId = state.getEffectiveModelId(eff);
      if (!project || !key?.trim() || !instruction.trim()) {
        showNotification('Open a project and enter what you want to change or add.', 'error');
        return;
      }
      clearError();
      setLoading(true);
      const ai = eff === 'anthropic' ? claude : gemini;
      const filesContent: Record<string, string> = {};
      for (const [path, file] of Object.entries(project.files)) {
        filesContent[path] = file.content;
      }
      try {
        setStep('Enhancing project…', 10);
        const filesRecord = await ai.enhanceProject({
          apiKey: key.trim(),
          currentDescription: project.description,
          instruction: instruction.trim(),
          files: filesContent,
          model: modelId,
          onProgress: (step) => setStep(step, 50),
          onStreamChunk: appendStreamingChunk,
        });
        const files: Record<string, ProjectFile> = {};
        for (const [path, content] of Object.entries(filesRecord)) {
          files[path] = createProjectFile(path, content);
        }
        setStep('Updating preview…', 85);
        let previewHtml = project.previewHtml;
        try {
          previewHtml = await ai.generatePreview({ apiKey: key.trim(), prompt: project.description + '\n\n' + instruction, model: modelId });
        } catch {
          // keep existing preview
        }
        const updated: Project = {
          ...project,
          files,
          description: project.description + '\n\nEnhancement: ' + instruction.trim(),
          previewHtml,
        };
        setProject(updated);
        addToHistory(updated);
        showNotification('Project enhanced successfully.', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Enhance failed';
        setLastError(msg);
        showNotification(msg, 'error');
      } finally {
        setLoading(false);
      }
    },
    [project, setProject, addToHistory, setLoading, setStep, setLastError, clearError, showNotification, appendStreamingChunk]
  );

  const isGenerating = useAiStore((s) => s.isLoading);
  const currentStep = useAiStore((s) => s.currentStep);
  const progress = useAiStore((s) => s.progress);
  const steps = useAiStore((s) => s.steps);

  return {
    generate,
    enhance,
    editFile,
    regeneratePreview,
    isGenerating,
    currentStep,
    progress,
    steps,
  };
}
