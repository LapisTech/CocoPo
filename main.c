// ======================================== //
// Setting                                  //
// ======================================== //

// Set exe path.
#define EXE_PATH "App\\CocoPo.exe"

// ======================================== //
// Program                                  //
// ======================================== //

#include <Windows.h>

int WINAPI WinMain( HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow )
{
	WCHAR exe[] = TEXT( EXE_PATH );
	PROCESS_INFORMATION pi = { 0 };
	STARTUPINFO si = { 0 };
	si.cb = sizeof( STARTUPINFO );

	CreateProcess( NULL, exe, NULL, NULL, FALSE, NORMAL_PRIORITY_CLASS, NULL, NULL, &si, &pi );

	return 0;
}
