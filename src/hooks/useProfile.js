import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_PROFILE } from '../constants/advisorDefaults';

export function useProfile() {
  const [profile, setProfile] = useLocalStorage('wp_profile', DEFAULT_PROFILE);

  const updateProfile = (updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
  };

  const addDebt = (debt) => {
    setProfile((prev) => ({
      ...prev,
      debts: [...(prev.debts || []), { ...debt, id: crypto.randomUUID() }],
    }));
  };

  const removeDebt = (id) => {
    setProfile((prev) => ({
      ...prev,
      debts: (prev.debts || []).filter((d) => d.id !== id),
    }));
  };

  const updateDebt = (id, updates) => {
    setProfile((prev) => ({
      ...prev,
      debts: (prev.debts || []).map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }));
  };

  return { profile, updateProfile, resetProfile, addDebt, removeDebt, updateDebt };
}
