///////////////////////////////////////////////////////////////////////////////
//
// Copyright (C) OMG Plc 2017.
// All rights reserved.  This software is protected by copyright
// law and international treaties.  No part of this software / document
// may be reproduced or distributed in any form or by any means,
// whether transiently or incidentally to some other use of this software,
// without the written permission of the copyright owner.
//
///////////////////////////////////////////////////////////////////////////////
#pragma once

#ifndef CDLL_EXPORT

#ifdef WIN32

#ifdef _EXPORTING
#define CDLL_EXPORT    __declspec(dllexport)
#else
#define CDLL_EXPORT    __declspec(dllimport)
#endif // _EXPORTING

#elif defined( __GNUC__ )

#if __GNUC__ < 4
#error gcc 4 is required.
#endif
#define CDLL_EXPORT     __attribute__((visibility("default")))

#else

#define CDLL_EXPORT

#endif

#endif 



#ifdef __cplusplus
extern "C" { 
#endif

#include "CTypeDefs.h"

CDLL_EXPORT CRetimingClient* RetimingClient_Create(void);
CDLL_EXPORT void RetimingClient_Destroy( CRetimingClient* client );

CDLL_EXPORT void  RetimingClient_GetVersion(CRetimingClient* client, COutput_GetVersion* outptr);

CDLL_EXPORT CBool RetimingClient_Connect(CRetimingClient* client, CString HostName);
CDLL_EXPORT CBool RetimingClient_ConnectAndStart(CRetimingClient* client, CString HostName, double FrameRate );
CDLL_EXPORT CEnum RetimingClient_Disconnect(CRetimingClient* client);
CDLL_EXPORT CEnum RetimingClient_IsConnected(CRetimingClient* client);

CDLL_EXPORT CEnum RetimingClient_EnableLightweightSegmentData( CRetimingClient* client );
CDLL_EXPORT CEnum RetimingClient_DisableLightweightSegmentData( CRetimingClient* client );
CDLL_EXPORT CBool RetimingClient_IsLightweightSegmentDataEnabled( CRetimingClient* client );

CDLL_EXPORT CEnum RetimingClient_SetAxisMapping(CRetimingClient* client, CEnum XAxis, CEnum YAxis, CEnum ZAxis);
CDLL_EXPORT void RetimingClient_GetAxisMapping(CRetimingClient* client, COutput_GetAxisMapping* outptr);

CDLL_EXPORT CEnum RetimingClient_UpdateFrame(CRetimingClient* client );
CDLL_EXPORT CEnum RetimingClient_UpdateFrameOffset(CRetimingClient* client, double i_Offset);
CDLL_EXPORT CEnum RetimingClient_WaitForFrame(CRetimingClient* client);

CDLL_EXPORT void RetimingClient_GetSubjectCount(CRetimingClient* client, COutput_GetSubjectCount* outptr);
CDLL_EXPORT CEnum RetimingClient_GetSubjectName(CRetimingClient* client, unsigned int SubjectIndex, int sizeOfBuffer, char* outstr);

CDLL_EXPORT CEnum RetimingClient_GetSubjectRootSegmentName(CRetimingClient* client, CString SubjectName, int sizeOfBuffer, char* outstr);

CDLL_EXPORT void RetimingClient_GetSegmentCount(CRetimingClient* client, CString SubjectName, COutput_GetSegmentCount* outptr);

CDLL_EXPORT CEnum RetimingClient_GetSegmentName(CRetimingClient* client, CString SubjectName,
  unsigned int   SegmentIndex, int sizeOfBuffer, char* outstr);

CDLL_EXPORT void RetimingClient_GetSegmentChildCount(CRetimingClient* client, CString SubjectName,
  CString SegmentName, COutput_GetSegmentChildCount* outptr);

CDLL_EXPORT CEnum RetimingClient_GetSegmentChildName(CRetimingClient* client, CString SubjectName,
  CString SegmentName,
  unsigned int   SegmentIndex, int sizeOfBuffer, char* outstr);

CDLL_EXPORT CEnum RetimingClient_GetSegmentParentName(CRetimingClient* client, CString SubjectName,
  CString SegmentName, int sizeOfBuffer, char* outstr);

CDLL_EXPORT void RetimingClient_GetSegmentStaticTranslation(CRetimingClient* client, CString SubjectName,
  CString SegmentName, COutput_GetSegmentStaticTranslation* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentStaticRotationHelical(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentStaticRotationHelical* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentStaticRotationMatrix(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentStaticRotationMatrix* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentStaticRotationQuaternion(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentStaticRotationQuaternion* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentStaticRotationEulerXYZ(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentStaticRotationEulerXYZ* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentStaticScale( CRetimingClient* client, CString SubjectName,
                                                                  CString SegmentName, COutput_GetSegmentStaticScale* outptr );

CDLL_EXPORT void RetimingClient_GetSegmentGlobalTranslation(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentGlobalTranslation* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentGlobalRotationHelical(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentGlobalRotationHelical* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentGlobalRotationMatrix(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentGlobalRotationMatrix* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentGlobalRotationQuaternion(CRetimingClient* client, CString  SubjectName, CString  SegmentName,
  COutput_GetSegmentGlobalRotationQuaternion* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentGlobalRotationEulerXYZ(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentGlobalRotationEulerXYZ* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentLocalTranslation(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentLocalTranslation* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentLocalRotationHelical(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentLocalRotationHelical* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentLocalRotationMatrix(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentLocalRotationMatrix* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentLocalRotationQuaternion(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentLocalRotationQuaternion* outptr);

CDLL_EXPORT void RetimingClient_GetSegmentLocalRotationEulerXYZ(CRetimingClient* client, CString  SubjectName,
  CString  SegmentName, COutput_GetSegmentLocalRotationEulerXYZ* outptr);


CDLL_EXPORT void RetimingClient_SetOutputLatency( CRetimingClient* client, CReal i_OutputLatency );
CDLL_EXPORT CReal RetimingClient_OutputLatency( CRetimingClient* client );

CDLL_EXPORT void RetimingClient_SetMaximumPrediction( CRetimingClient* client, CReal i_MaxPrediction );
CDLL_EXPORT CReal RetimingClient_MaximumPrediction( CRetimingClient* client );

CDLL_EXPORT CEnum RetimingClient_ClearSubjectFilter( CClient* client );
CDLL_EXPORT CEnum RetimingClient_AddToSubjectFilter( CClient* client, CString i_rSubjectName );

CDLL_EXPORT CEnum RetimingClient_SetTimingLogFile( CRetimingClient* client, CString i_rClientLog, CString i_rStreamLog);

CDLL_EXPORT CEnum RetimingClient_SetConnectionTimeout( CRetimingClient* client, unsigned int i_Timeout );

#ifdef __cplusplus
}
#endif
