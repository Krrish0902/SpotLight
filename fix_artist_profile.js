const fs = require('fs');
const file = './screens/ArtistProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove LinearGradient import if exists
content = content.replace(/import \{.*?LinearGradient.*?\} from 'expo-linear-gradient';?\\n/g, '');

// Remove standard cover linear gradient
content = content.replace(/<LinearGradient[^>]+style=\{StyleSheet.absoluteFill\}[^>]*\/>/g, '');
content = content.replace(/<LinearGradient[^>]+style=\{\[StyleSheet.absoluteFill, styles.videoOverlay\]\}[^>]*\/>/g, '');

// Replace styles block completely 
const stylesStart = content.indexOf('const styles = StyleSheet.create({');
if (stylesStart > -1) {
  content = content.substring(0, stylesStart) + `const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  scroll: { backgroundColor: '#0d0d0d' },
  coverWrap: { height: 160, position: 'relative', backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333333' },
  coverImg: { width: '100%', height: '100%', opacity: 0.6 },
  backBtn: { position: 'absolute', top: 56, left: 16, backgroundColor: '#0d0d0d', borderWidth: 1, borderColor: '#333333', borderRadius: 4, padding: 8 },
  headerRight: { position: 'absolute', top: 56, right: 16, flexDirection: 'row', gap: 12 },
  iconBtn: { backgroundColor: '#0d0d0d', borderWidth: 1, borderColor: '#333333', borderRadius: 4, padding: 8 },
  shareBtn: {},
  profileContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  profileImgContainer: {
    alignSelf: 'flex-start',
    marginTop: -40,
    width: 80,
    height: 80,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#0d0d0d',
    zIndex: 10,
  },
  profileImg: { width: '100%', height: '100%', borderRadius: 6 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#1a1a1a',
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  editCoverBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#0d0d0d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  editCoverText: { color: '#ffffff', fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
  profileHeader: { alignItems: 'flex-start', marginTop: 16, marginBottom: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  name: { fontSize: 24, fontWeight: '700', color: '#ffffff', letterSpacing: -0.5 },
  usernamePill: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333333', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 12 },
  boostedBadge: { backgroundColor: '#1a1a1a', borderRadius: 4, borderWidth: 1, borderColor: '#333333', paddingHorizontal: 8, paddingVertical: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  metaText: { color: '#a3a3a3', fontSize: 13, fontFamily: 'monospace' },
  availableBadge: { backgroundColor: '#0d0d0d', marginTop: 12, borderWidth: 1, borderColor: '#10b981', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 32, width: '100%' },
  bookBtn: { flex: 1, backgroundColor: '#ffffff', flexDirection: 'row', gap: 8, borderRadius: 6, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  dashboardBtn: { flex: 1, backgroundColor: '#1a1a1a', flexDirection: 'row', gap: 8, borderRadius: 6, paddingVertical: 14, borderWidth: 1, borderColor: '#333333', justifyContent: 'center', alignItems: 'center' },
  bookBtnText: { color: '#000000', fontWeight: 'bold', fontSize: 14, fontFamily: 'monospace' },
  msgBtn: { borderColor: '#333333', backgroundColor: '#1a1a1a', borderWidth: 1, borderRadius: 6, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  bioCard: { backgroundColor: '#1a1a1a', padding: 24, marginBottom: 32, borderRadius: 6, borderWidth: 1, borderColor: '#333333' },
  signOutBtn: { flexDirection: 'row', gap: 8, marginBottom: 32, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#f43f5e', borderRadius: 6, paddingVertical: 14, justifyContent: 'center' },
  signOutText: { color: '#f43f5e', fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  bioTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  bioText: { color: '#a3a3a3', lineHeight: 22, fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32, justifyContent: 'space-between' },
  statCard: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333333', borderRadius: 6 },
  statNum: { fontSize: 20, fontWeight: '700', color: '#ffffff', fontFamily: 'monospace' },
  statLabel: { color: '#a3a3a3', fontSize: 11, marginTop: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 24 },
  videoItem: { width: '47%', aspectRatio: 3 / 4, borderRadius: 6, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#333333', backgroundColor: '#1a1a1a' },
  videoThumb: { width: '100%', height: '100%', opacity: 0.8 },
  videoOverlay: { bottom: 0, height: '40%' },
  videoInfo: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  videoTitle: { color: '#ffffff', fontWeight: '600', fontSize: 13, marginBottom: 4 },
  videoViews: { color: '#a3a3a3', fontSize: 11, fontWeight: '500', fontFamily: 'monospace' },
  videoFeedModal: { flex: 1, backgroundColor: '#0d0d0d' },
  videoFeedHeader: { position: 'absolute', top: 56, left: 16, zIndex: 10 },
  videoFeedBackBtn: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333333', borderRadius: 4, padding: 8 },
  scheduleCard: { backgroundColor: '#1a1a1a', padding: 24, borderRadius: 6, borderWidth: 1, borderColor: '#333333', marginTop: 24 },
  scheduleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333333' },
  scheduleInfo: { flex: 1, minWidth: 0 },
  scheduleTitle: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  scheduleMeta: { color: '#a3a3a3', fontSize: 13, marginTop: 4, fontFamily: 'monospace' },
  scheduleBadge: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#0d0d0d', borderWidth: 1, borderColor: '#333333', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  emptySchedule: { alignItems: 'center', padding: 40 },
  emptyScheduleText: { color: '#a3a3a3', fontSize: 14, marginTop: 12, fontFamily: 'monospace' },
  reviewCard: { backgroundColor: '#1a1a1a', padding: 24, borderRadius: 6, borderWidth: 1, borderColor: '#333333', marginTop: 24 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 4, borderWidth: 1, borderColor: '#333333' },
  reviewMeta: { flex: 1 },
  reviewer: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  reviewTime: { color: '#a3a3a3', fontSize: 12, fontFamily: 'monospace' },
  reviewText: { color: '#e5e5e5', fontSize: 14, lineHeight: 22 },
  emptyState: { width: '100%', alignItems: 'center', padding: 40 },
  emptyText: { color: '#a3a3a3', fontSize: 14, fontFamily: 'monospace' },
});
`;
}

fs.writeFileSync(file, content);
console.log('Fixed ArtistProfile.tsx');
