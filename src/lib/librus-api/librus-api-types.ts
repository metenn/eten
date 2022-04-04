// interface IResource {
// 	Id?: string;
// 	Type?: string;
// 	Url: string;
// }

interface IResourcesResource {
	Url: string;
}
interface IChangeResource {
	Id: string;
	Type: string;
	Url: string;
}
interface IStringIdResource {
	Id: string;
	Url: string;
}
interface ISubjectResource {
	Id: number;
	Url: string;
}
interface IUserResource {
	Id: number;
	Url: string;
}

interface IChange {
	Id: number;
	Resource: IChangeResource; // Id, Type, Url
	Type: string;
	AddDate: string;
	extraData: string|null;
}

export interface APIv3BaseResponse {
	Resources?: {
		[path: string]: IResourcesResource; // Url
	}
	Url?: string;
	Status?: string;
	Code?: string;
	Message?: string;
	MessagePL?: string;
}

// https://api.librus.pl/3.0/PushChanges?pushDevice=<PUSH DEVICE>
export interface APIPushChanges extends APIv3BaseResponse {
	Changes: IChange[];
	ChangesTimestamp: number;
}

// https://portal.librus.pl/api/v3/SynergiaAccounts/fresh/<LOGIN>
// login is Synergia login (e.g. 1233450u)
export interface APISynergiaAccountsFresh {
	id: number;
	accountIdentifier: string;
	group: string;
	accessToken: string;
	login: string;
	studentName: string;
	scopes: string;
	state: string;
}

// https://portal.librus.pl/api/v3/SynergiaAccounts
export interface APISynergiaAccounts {
	lastModification: number;
	accounts: APISynergiaAccountsFresh[];
}

// POST https://api.librus.pl/3.0/ChangeRegister
// also https://api.librus.pl/3.0/ChangeRegister/<pushdevice id>
// {"sendPush":"0","appVersion":"6.0.0"}
export interface PostAPIChangeRegister extends APIv3BaseResponse {
	ChangeRegister: {
		Id: number;
		Url: string;
	}
}

// https://api.librus.pl/3.0/Me
export interface APIMe extends APIv3BaseResponse {
	Me: {
		Account:{
			Id: number;
			UserId: number;
			FirstName: string;
			LastName: string;
			Email: string;
			GroupId: number;
			IsActive: boolean;
			Login: string;
			IsPremium: boolean;
			IsPremiumDemo: boolean;
			ExpiredPremiumDate: number;
		}
		Refresh: number;
		User: {
			FirstName: string;
			LastName: string;
		}
		Class: IStringIdResource; // Id, Url
	}
}

// https://api.librus.pl/3.0/SystemData
export interface APISystemData extends APIv3BaseResponse {
	Time: string;
	Date: string;
	Status?: string;
}

interface ICategory {
	Id: number;
	Teacher: IUserResource; // Id, Url
	Color: IStringIdResource; // Id, Url
	Name: string;
	AdultsExtramural: boolean;
	AdultsDaily: boolean;
	Standard: boolean;
	IsReadOnly: string;
	CountToTheAverage: boolean;
	Weight: number;
	Short: string;
	BlockAnyGrades: boolean;
	ObligationToPerform: boolean;
}

// https://api.librus.pl/3.0/Grades/Categories/<Comma separated GradeCategory IDs?>
export interface APIGradesCategorie extends APIv3BaseResponse {
	Categorie: ICategory;
}
export interface APIGradesCategories extends APIv3BaseResponse {
	Categories: ICategory[];
}

export interface ISchoolNotice {
	Id: string;
	StartDate: string;
	EndDate: string;
	Subject: string;
	Content: string;
	AddedBy: IUserResource // Id, Url
	CreationDate: string;
	WasRead: boolean;
}

// https://api.librus.pl/3.0/SchoolNotices/
export interface APISchoolNotices extends APIv3BaseResponse {
	SchoolNotice: ISchoolNotice[];
}

// https://api.librus.pl/3.0/SchoolNotices/<SchoolNotice ID>
export interface APISchoolNotice extends APIv3BaseResponse {
	SchoolNotice: ISchoolNotice;
}

interface IAttendance {
	Id: number;
	Lesson: ISubjectResource; // Id, Url
	Student: IUserResource; // Id, Url
	Date: string;
	AddDate: string;
	LessonNo: number;
	Semester: number;
	Type: IStringIdResource; // Id, Url
	AddedBy: IUserResource; // Id, Url
}

// https://api.librus.pl/3.0/Attendances/<Comma separated Attendance IDs>
export interface APIAttendance extends APIv3BaseResponse {
	Attendance: IAttendance;
}
export interface APIAttendances extends APIv3BaseResponse {
	Attendances: IAttendance[];
}

interface IHomework {
	Id: number;
	Content: string;
	Date: string;
	Category: IStringIdResource; // Id, Url
	LessonNo: string;
	TimeFrom: string;
	TimeTo: string;
	AddDate: string;
	CreatedBy: IUserResource; // Id, Url
	Class: IStringIdResource; // Id, Url
	Subject: ISubjectResource; // Id, Url
}

// https://api.librus.pl/3.0/Homeworks/<Comma separated Homework IDs>
export interface APIHomework extends APIv3BaseResponse {
	Homework: IHomework;
}
export interface APIHomeworks extends APIv3BaseResponse {
	Homeworks: IHomework[];
}

interface IGrade {
	Id: number;
	Lesson: IStringIdResource; // Id, Url
	Subject: IStringIdResource; // Id, Url
	Student: IUserResource; // Id, Url
	Category: IStringIdResource; // Id, Url
	AddedBy: IUserResource; // Id, Url
	Grade: string;
	Date: string;
	AddDate: string;
	Semester: number;
	IsConstituent: boolean;
	IsSemester: boolean;
	IsSemesterProposition: boolean;
	IsFinal: boolean;
	IsFinalProposition: boolean;
	Comments: IStringIdResource[]; // Id, Url
}

interface IGradeComment {
	Id: number;
	AddedBy: IStringIdResource; // Id, Url
	Grade: IStringIdResource; // Id, Url
	Text: string;
}

// https://api.librus.pl/3.0/Grades/<Comma separated Grade IDs>
export interface APIGrade extends APIv3BaseResponse {
	Grade: IGrade;
}
export interface APIGrades extends APIv3BaseResponse {
	Grades: IGrade[];
}

// https://api.librus.pl/3.0/Grades/Comments/<Comma separated Grade IDs>
export interface APIGradesComment extends APIv3BaseResponse {
	Comment: IGradeComment;
}
export interface APIGradesComments extends APIv3BaseResponse {
	Comments: IGradeComment[];
}

interface ILesson {
	Id: number;
	Teacher: IUserResource; // Id, Url
	Subject: ISubjectResource; // Id, Url
	Class: IStringIdResource; // Id, Url
}

// https://api.librus.pl/3.0/Lessons/<Comma separated Lesson IDs>
export interface APILesson extends APIv3BaseResponse {
	Lesson: ILesson;
}
export interface APILessons extends APIv3BaseResponse {
	Lessons: ILesson[];
}

interface ITeacherFreeDay {
	Id: number;
	Name: string;
	DateFrom: string;
	DateTo: string;
	AddDate: string;
	Teacher: IUserResource // Id, Url
	TimeFrom: string;
	TimeTo: string;
}

// https://api.librus.pl/3.0/Calendars/TeacherFreeDays/<Comma separated IDs>
export interface APICalendarsTeacherFreeDay extends APIv3BaseResponse {
	TeacherFreeDay: ITeacherFreeDay;
}
export interface APICalendarsTeacherFreeDays extends APIv3BaseResponse {
	TeacherFreeDays: ITeacherFreeDay[];
}

interface ISubstitution {
	Id: number;
	IsCancelled: boolean;
	IsShifted: boolean;
	OrgDate: string;
	OrgLessonNo: string;
	OrgSubject: ISubjectResource; // Id, Url
	OrgTeacher: IUserResource; // Id, Url
	Date?: string;
	LessonNo?: string;
	Subject?: ISubjectResource; // Id, Url
	Teacher?: IUserResource; // Id, Url
}

// https://api.librus.pl/3.0/Calendars/Substitutions/<Comma separated IDs>
export interface APICalendarsSubstitution extends APIv3BaseResponse {
	Substitution: ISubstitution;
}
export interface APICalendarsSubstitutions extends APIv3BaseResponse {
	Substitutions: ISubstitution[];
}

export interface IUser {
    Id: number;
    AccountId: string;
    FirstName: string;
    LastName: string;
    IsEmployee: boolean;
	GroupId?: number // What is this?
}

// https://api.librus.pl/3.0/Users/<Comma separated IDs>
export interface APIUser extends APIv3BaseResponse {
	User: IUser;
}
export interface APIUsers extends APIv3BaseResponse {
	Users: IUser[];
}

interface ISubject {
	Id: number;
	Name: string;
	No: number;
	Short: string;
	IsExtracurricular: boolean;
	IsBlockLesson: boolean;
}

// https://api.librus.pl/2.0/Subjects/<Comma separated IDs>
export interface APISubject extends APIv3BaseResponse {
	Subject: ISubject;
}
export interface APISubjects extends APIv3BaseResponse {
	Subjects: ISubject[];
}