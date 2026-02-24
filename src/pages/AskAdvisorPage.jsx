import { useState, useMemo } from 'react';
import { useProfile } from '../hooks/useProfile';
import { computeAdvisory } from '../utils/advisorEngine';
import { TOPICS, generateAdvice } from '../utils/advisorKnowledge';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

export default function AskAdvisorPage() {
  const { profile } = useProfile();
  const advisory = useMemo(() => computeAdvisory(profile), [profile]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [answers, setAnswers] = useState([]);

  const handleTopicClick = (topicId) => {
    const result = generateAdvice(topicId, profile, advisory);
    setSelectedTopic(topicId);
    setAnswers((prev) => [...prev, result]);
    setTimeout(() => {
      document.getElementById('answer-bottom')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    const result = generateAdvice(customQuestion.trim(), profile, advisory);
    setAnswers((prev) => [...prev, result]);
    setCustomQuestion('');
    setTimeout(() => {
      document.getElementById('answer-bottom')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleClear = () => {
    setAnswers([]);
    setSelectedTopic(null);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Ask Your Advisor</h1>
        <p className="text-sm text-gray-500 mt-1">
          {advisory
            ? `Advice personalized for your ${advisory.risk.label.toLowerCase()} profile`
            : 'Set up your profile on the Advisor page for personalized answers'}
        </p>
      </div>

      {/* Topic Grid */}
      <Card title="Pick a Topic" subtitle="Select a topic for detailed, personalized advice">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleTopicClick(topic.id)}
              className={`text-left p-4 rounded-lg border transition-all cursor-pointer ${
                selectedTopic === topic.id
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-gray-800 hover:border-gray-700 bg-gray-900 hover:bg-gray-850'
              }`}
            >
              <span className="text-2xl mb-2 block">{topic.icon}</span>
              <p className="text-sm font-medium text-gray-100">{topic.label}</p>
              <p className="text-xs text-gray-500 mt-1">{topic.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Custom Question */}
      <Card title="Or Ask Anything" subtitle="Type a financial question">
        <form onSubmit={handleCustomSubmit} className="flex gap-3">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="e.g. Should I buy a house? How do I earn more money?"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25"
          />
          <Button type="submit" disabled={!customQuestion.trim()}>
            Ask
          </Button>
        </form>
      </Card>

      {/* Answers */}
      {answers.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-100">Advice</h2>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear All
            </Button>
          </div>

          {answers.map((answer, i) => (
            <AdviceCard key={i} answer={answer} />
          ))}

          <div id="answer-bottom" />
        </div>
      )}
    </div>
  );
}

function AdviceCard({ answer }) {
  return (
    <Card className="border-emerald-500/10">
      <h3 className="text-lg font-bold text-gray-100 mb-4">{answer.title}</h3>
      <div className="space-y-5">
        {answer.sections.map((section, i) => (
          <div key={i}>
            <h4 className="text-sm font-semibold text-emerald-500 mb-1.5">{section.title}</h4>
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {renderMarkdownLite(section.content)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function renderMarkdownLite(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-gray-100 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
