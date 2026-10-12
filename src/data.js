import { FileCheck2, Search, Link2, ChartNoAxesCombined, UserRound, ChartPie, Mail, Vault, UsersRound, BookOpen } from 'lucide-react';

// Exact original project destinations; this public snapshot is not a live registry.
export const PROJECTS = [
  { name: 'Claus Approval Contracts', label: 'Approval Contracts', slug: 'claus-approval-contracts', Icon: FileCheck2, detail: 'Registered project' },
  { name: 'Claus Balance Explorer', label: 'Balance Explorer', slug: 'claus-balance-explorer', Icon: ChartPie, detail: '1 interface' },
  { name: 'Claus Balance Lens', label: 'Balance Lens', slug: 'claus-balance-lens', Icon: Search, detail: '1 contract' },
  { name: 'Claus Contract Inbox', label: 'Contract Inbox', slug: 'claus-contract-inbox', Icon: Mail, detail: 'Registered project' },
  { name: 'Claus Chain Data', label: 'Chain Data', slug: 'claus-data-service', Icon: Link2, detail: '1 service' },
  { name: 'Claus Native Vault', label: 'Native Vault', slug: 'claus-native-vault', Icon: Vault, detail: '1 contract' },
  { name: 'Claus Balance Report', label: 'Balance Report', slug: 'claus-report-service', Icon: ChartNoAxesCombined, detail: '1 service' },
  { name: 'Reference consumer', label: 'Reference Consumer', slug: 'ref-ca9fa5405b-consumer', Icon: UsersRound, detail: 'Registered project' },
  { name: 'Reference provider', label: 'Reference Provider', slug: 'ref-ca9fa5405b-provider', Icon: UserRound, detail: 'Registered project' },
  { name: 'Reference publisher', label: 'Reference Publisher', slug: 'ref-ca9fa5405b-publisher', Icon: BookOpen, detail: '1 agent · 1 interface' },
];
export const WORLDS = [
  { id: 'build', label: 'Build', path: '/docs' },
  { id: 'lab', label: 'Lab', path: '/Lab' },
  { id: 'nft', label: 'NFTs', path: '/Staking/NFT' },
  { id: 'hooks', label: 'Token & hooks', path: '/Hooks' },
  { id: 'club', label: 'Club', path: '/Club' },
  { id: 'staking', label: 'Staking', path: '/Staking/Token' },
];
export const CONTRACT = '0x1b54E762aa34CF6E28E9C082F2848e28E45DA6b8';
