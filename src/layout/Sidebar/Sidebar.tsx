import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { Drawer as MuiDrawer, ListItemButton, IconButton, Box, Divider, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useTranslation } from 'react-i18next';
import { SidebarItemsType } from './types';
import SidebarNav from './SidebarNav';
import Footer from './SidebarFooter';
import { isMobileOnly } from 'react-device-detect';

/* =========================
   Styled Components
========================= */

const Drawer = styled(MuiDrawer)`
  & .MuiDrawer-paper {
    width: 258px;
    background: linear-gradient(180deg, #1f2d1f 0%, #2b2b2b 100%);
    color: #e0e0e0;
    border-right: none;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.25);
  }
`;

const Brand = styled(ListItemButton)`
  padding: 32px 0 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  img {
    height: 65px;
    object-fit: contain;
  }
`;

const CollapseSection = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px;
`;

const DividerLine = styled.div`
  height: 1px;
  margin: 8px 0;
  background: rgba(255, 255, 255, 0.08);
`;

/* =========================
   Props
========================= */

export interface SidebarProps {
  PaperProps: {
    style: {
      width: number;
    };
  };
  variant?: 'permanent' | 'persistent' | 'temporary';
  open?: boolean;
  onClose?: () => void;
  items: {
    title: string;
    pages: SidebarItemsType[];
  }[];
  showFooter?: boolean;
}

/* =========================
   Component
========================= */

function Sidebar({ items, onClose, ...rest }: SidebarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Drawer
      {...rest}
      PaperProps={{
        sx: {
          width: 280,
          background: '#ffffffff',
          color: '#fff',
          borderRight: 'none'
        }
      }}>
      {/* Header */}
      <Box
        sx={{
          position: 'relative',
          px: 3,
          pt: 4,
          pb: 3,
          background: 'linear-gradient(180deg, #0f2a17 0%, #1a3a22 100%)'
        }}>
        {/* Collapse Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: 'rgba(255,255,255,0.75)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.08)'
            }
          }}>
          <ChevronLeftIcon />
        </IconButton>

        {/* Logo */}
        <Box
          component={NavLink}
          to="/"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none'
          }}>
          <Box
            sx={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              p: 1,
              background:
                'radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.98), rgba(246, 249, 243, 0.96) 54%, rgba(232, 239, 226, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow:
                '0 12px 28px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
            <Box
              component="img"
              src="/logo-carbon-edge.png"
              alt="CarbonEdge Logo"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 10px rgba(25, 38, 20, 0.10))'
              }}
            />
          </Box>

        </Box>
      </Box>

      <Divider
        sx={{
          borderColor: 'rgba(255,255,255,0.08)'
        }}
      />

      {/* Menu Section */}
      <SidebarNav items={items} onClick={onClose} />

    </Drawer>
  );
}

export default Sidebar;
