/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useContext, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { StatusContext } from '../../context/Status';

const SetupCheck = ({ children }) => {
  const [statusState] = useContext(StatusContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      statusState?.status?.setup === false &&
      location.pathname !== '/setup'
    ) {
      // 使用 navigate 而不是 window.location.href，这样会自动处理 basename
      navigate('/setup', { replace: true });
    }
  }, [statusState?.status?.setup, location.pathname, navigate]);

  return children;
};

export default SetupCheck;
