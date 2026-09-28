import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import styles from './ConsultationPage.module.css';
import ToothChartUIKit from './ToothChartUIKit';
import WebcamCapture from './WebcamCapture'; // I will create this

const API_BASE = 'http://127.0.0.1:8000/api';

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };
}

// ... will continue
